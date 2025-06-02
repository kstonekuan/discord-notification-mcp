/// <reference path="../worker-configuration.d.ts" />

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type {
	APIAllowedMentions,
	APIEmbed,
	APIMessage,
	RESTPostAPIWebhookWithTokenJSONBody,
} from "discord-api-types/v10";
import { AllowedMentionsTypes } from "discord-api-types/v10";
import { z } from "zod";

// Helper function to send Discord messages via webhook
async function sendDiscordMessage(
	webhookUrl: string,
	content: string,
	options?: {
		tts?: boolean;
		embeds?: APIEmbed[];
		allowed_mentions?: APIAllowedMentions;
		wait?: boolean;
	},
): Promise<APIMessage | null> {
	const payload: RESTPostAPIWebhookWithTokenJSONBody = {
		content,
		...options,
	};

	// Add ?wait=true to get message details back
	const url = new URL(webhookUrl);
	if (options?.wait !== false) {
		url.searchParams.set("wait", "true");
	}

	const response = await fetch(url.toString(), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Discord API error: ${response.status} ${errorText}`);
	}

	// 204 No Content means success but no response body
	if (response.status === 204) {
		return null;
	}

	const responseText = await response.text();
	if (!responseText) {
		return null;
	}

	return JSON.parse(responseText) as APIMessage;
}

// Define our MCP agent with tools
export class DiscordMCP extends McpAgent {
	server = new McpServer({
		name: "Discord Notification MCP",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"send_discord_message",
			"Send a message to Discord via webhook",
			{
				content: z.string().describe("The message content to send"),
				tts: z.boolean().optional().describe("True if this is a TTS message"),
				embeds: z
					.array(
						z.object({
							title: z.string().optional(),
							description: z.string().optional(),
							url: z.string().optional(),
							color: z.number().optional(),
							timestamp: z.string().optional(),
							footer: z
								.object({
									text: z.string(),
									icon_url: z.string().optional(),
								})
								.optional(),
							author: z
								.object({
									name: z.string(),
									url: z.string().optional(),
									icon_url: z.string().optional(),
								})
								.optional(),
							fields: z
								.array(
									z.object({
										name: z.string(),
										value: z.string(),
										inline: z.boolean().optional(),
									}),
								)
								.optional(),
						}),
					)
					.optional()
					.describe("Array of embed objects"),
				allowed_mentions: z
					.object({
						parse: z
							.array(
								z.enum([
									AllowedMentionsTypes.Role,
									AllowedMentionsTypes.User,
									AllowedMentionsTypes.Everyone,
								]),
							)
							.optional(),
						roles: z.array(z.string()).optional(),
						users: z.array(z.string()).optional(),
						replied_user: z.boolean().optional(),
					})
					.optional()
					.describe("Allowed mentions object"),
			},
			async ({ content, tts, embeds, allowed_mentions }) => {
				const env = this.env as Env;

				if (!env.WEBHOOK_URL) {
					return {
						content: [
							{ type: "text", text: "Error: WEBHOOK_URL is not configured" },
						],
					};
				}

				try {
					const message = await sendDiscordMessage(env.WEBHOOK_URL, content, {
						tts,
						embeds,
						allowed_mentions,
					});

					return {
						content: [
							{
								type: "text",
								text: message
									? `Message sent successfully to Discord (message ID: ${message.id})`
									: "Message sent successfully to Discord",
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return DiscordMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return DiscordMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
