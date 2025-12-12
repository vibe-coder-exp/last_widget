# Integration Guide

## Embedding the Widget

Add the following code to the `<body>` of your website.

```html
<!-- 1. Supabase Client Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Configuration (Contains URL & Key) -->
<script src="path/to/config.js"></script>

<!-- 3. Widget Script -->
<script src="path/to/chat-widget.js?botId=YOUR_BOT_ID"></script>
```

### URL Parameters

-   `botId`: (Required) The unique ID of the bot configuration to load.
-   `fullscreen`: (Optional) If set to true, widget initializes in fullscreen mode (useful for standalone pages).

## n8n Integration

The widget sends a POST request to your n8n webhook with the following JSON structure:

```json
{
  "action": "sendMessage",
  "sessionId": "uuid-v4-string",
  "botId": "your-bot-id",
  "route": "general",
  "chatInput": "User's message here",
  "metadata": {
    "userId": ""
  }
}
```

### Steps to Setup n8n

1.  **Webhook Node**:
    -   Method: `POST`
    -   Path: `/webhook/chat` (or similar)
    -   Authentication: None (or validate Header if needed)
2.  **AI Processing**:
    -   Connect Webhook to your AI Agent or Chain.
    -   Pass `chatInput` as the prompt.
    -   Use `sessionId` for memory/context.
3.  **Response**:
    -   **Option A (Direct)**: Use a "Respond to Webhook" node. valid JSON: `[{ "output": "Hello there!" }]`
    -   **Option B (Supabase)**: Use Supabase node to INSERT into `chat_messages` table.
        -   `session_id`: `{{json.body.sessionId}}`
        -   `content`: AI Response
        -   `sender_type`: `bot`
    -   *Note: Realtime handles the update on the client side for Option B.*
