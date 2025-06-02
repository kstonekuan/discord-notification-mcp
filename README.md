# Discord Notification MCP Server

<div align="center">
  <img src="./images/logo.png" alt="Discord MCP Logo" width="200">
  
  An MCP (Model Context Protocol) server that sends notifications to Discord when Claude Code completes tasks. Built with TypeScript using the Cloudflare Agents SDK and deployable on Cloudflare Workers.
</div>

## Features

- 🤖 **MCP Tool**: Provides a `send_discord_message` tool for sending notifications
- 🚀 **Cloudflare Workers**: Runs serverless with global distribution
- 🔐 **Secure**: Uses Cloudflare secrets for credentials
- 🌐 **Dual Transport**: Supports both SSE and Streamable HTTP for maximum compatibility
- 💾 **Durable Objects**: State management required by McpAgent
- 💬 **Rich Formatting**: Supports embeds, TTS messages, and mention controls

## Architecture

This server implements the MCP specification using Cloudflare's Agents SDK:
- **GET /sse**: SSE endpoint for MCP communication
- **POST /mcp**: Streamable HTTP endpoint for MCP communication
- Built with TypeScript, MCP SDK, and Cloudflare Agents SDK
- Proper JSON-RPC 2.0 error handling
- Durable Objects for stateful connections (required by McpAgent)
- Node.js compatibility mode enabled

## Setup

### Prerequisites

1. **Discord Webhook**: Create a webhook in your Discord channel:
   - Right-click on the channel → Edit Channel → Integrations → Webhooks
   - Click "New Webhook" and copy the webhook URL
2. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Configuration

1. Create a `.dev.vars` file from the example:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Then edit `.dev.vars` with your webhook URL. This file is used for both local development and deployment.

2. For production deployment, set up Cloudflare secrets:
   ```bash
   npx wrangler secret put WEBHOOK_URL
   ```

3. Update `wrangler.toml` with your worker name if desired

### Deployment

Deploy to Cloudflare Workers:

```bash
# First set secrets
npx wrangler secret put WEBHOOK_URL

# Then deploy
pnpm run deploy
```

### Claude Code Configuration

Add the MCP server to Claude Code using the CLI via SSE transport:

```bash
# For production deployment (SSE)
claude mcp add discord-notify https://your-worker-name.workers.dev/sse -t sse

# For local development
claude mcp add discord-notify http://localhost:8787/sse -t sse
```

**Note**: This server supports both SSE (Server-Sent Events) and Streamable HTTP transport. While SSE works well, Streamable HTTP provides better reliability and is the newer standard.

You can verify the configuration with:
```bash
claude mcp list
```

## Usage

Once configured, Claude Code can send notifications to your Discord whenever you need them.

### Available Tool

**send_discord_message**: Send a notification message to Discord
- `content` (required): The message content to send
- `tts` (optional): Send as Text-to-Speech message
- `embeds` (optional): Array of embed objects for rich formatting
- `allowed_mentions` (optional): Control which mentions are parsed

Example usage:
```javascript
// Simple message
await send_discord_message({ content: "Task completed!" })

// Rich embed message
await send_discord_message({ 
  content: "Status Update",
  embeds: [{
    title: "Build Results",
    description: "All tests passed",
    color: 5025616, // Green
    fields: [
      { name: "Tests", value: "52/52", inline: true },
      { name: "Duration", value: "2m 34s", inline: true }
    ]
  }]
})
```

### When You'll Get Notifications

Claude Code sends notifications when:
- You explicitly ask: "notify me when done" or "let me know on Discord"
- Errors occur during execution
- Important milestones are reached
- User input or intervention is needed

### Example Scenarios

```bash
# You say: "Deploy to production and notify me when done"
# Result: 🤖 Claude Code Notification
#         Deployment completed successfully! The app is now live.

# You say: "Run all tests and let me know the results"
# Result: 🤖 Claude Code Notification
#         All tests passed! 52/52 tests successful.

# You say: "Process this data and notify me if there are any errors"
# Result: 🤖 Claude Code Notification
#         Error: Failed to process row 451 - invalid date format
```

### Example Notifications

<div align="center">
  <img src="./images/discord.jpg" alt="Discord Notification Example" width="600">
  <p><em>Example of Discord notifications from Claude Code</em></p>
</div>

<div align="center">
  <img src="./images/claude_code.png" alt="Claude Code Integration Example" width="600">
  <p><em>Claude Code sending notifications during task completion</em></p>
</div>

### CLAUDE.md Examples

To encourage Claude Code to use Discord notifications effectively, add these to your CLAUDE.md:

```markdown
# Discord Notifications

Use the mcp__discord-notify__send_discord_message tool to send notifications to Discord.

- Always send a Discord notification when:
  - A task is fully complete
  - You need user input to continue
  - An error occurs that requires user attention
  - The user explicitly asks for a notification (e.g., "notify me", "send me a message", "let me know")

- Include relevant details in notifications:
  - For builds/tests: success/failure status and counts
  - For errors: the specific error message and file location

- Use concise, informative messages like:
  - "✅ Build completed successfully (2m 34s)"
  - "❌ Tests failed: 3/52 failing in auth.test.ts"
  - "⚠️ Need permission to modify /etc/hosts"
```

## Development

Run locally:
```bash
# Start local development server
pnpm dev
```

For local development, Wrangler will automatically load environment variables from your `.dev.vars` file.

Run all checks before deployment:
```bash
pnpm build
```

This command runs:
1. `pnpm format` - Format code with Biome
2. `pnpm lint:fix` - Fix linting issues  
3. `pnpm cf-typegen` - Generate Cloudflare types
4. `pnpm type-check` - Check TypeScript types

Test the server:
```bash
# Test SSE connection
curl http://localhost:8787/sse

# Test health endpoint
curl http://localhost:8787/
```

## Debugging

### Testing the SSE Connection

You can test the SSE endpoint directly:
```bash
curl -N http://localhost:8787/sse
```

This should return an event stream starting with an `endpoint` event.

### Common Issues

1. **Connection closes immediately**: Check that your worker is running and accessible at the specified URL.

2. **No endpoint event received**: Ensure the SSE headers are being sent correctly and the stream is properly formatted.

3. **Discord notifications not sent**: Verify your `WEBHOOK_URL` is correctly set in the worker environment.

## Technical Details

- **Language**: TypeScript (ES2021 target)
- **Runtime**: Cloudflare Workers with Node.js compatibility
- **Protocol**: MCP (Model Context Protocol)
- **Transport**: SSE and Streamable HTTP
- **State Management**: Durable Objects (required by McpAgent)
- **Observability**: Enabled for monitoring

## References

This project was built following these guides:
- [Build a Remote MCP server - Cloudflare Agents](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- [Model Context Protocol (MCP) - Cloudflare Agents](https://developers.cloudflare.com/agents/model-context-protocol/)
- [MCP Transport Methods - Cloudflare Agents](https://developers.cloudflare.com/agents/model-context-protocol/transport/)
- [Cloudflare MCP Template (remote-mcp-authless)](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

## License

MIT