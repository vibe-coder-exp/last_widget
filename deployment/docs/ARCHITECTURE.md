# Architecture Overview

## System Components

1.  **Frontend Widget (`chat-widget.js`)**
    -   Vanilla JavaScript (no framework dependencies).
    -   Connects directly to Supabase for configuration and history.
    -   Uses Supabase Realtime for listening to new messages.
    -   Sends messages via HTTP POST to n8n Webhook.

2.  **Backend (Supabase)**
    -   **`bot_configurations` table**: Stores branding, logic, and settings.
    -   **`chat_messages` table**: specific message history.
    -   **Realtime**: Broadcasts INSERT events on `chat_messages` to connected clients.
    -   **Functions**: `increment_message_count` handles rate limiting logic.

3.  **AI Orchestration (n8n)**
    -   Receives user messages via Webhook.
    -   Processes logic (AI Agent, Tool calling, Database lookups).
    -   Returns response via Webhook Response (for HTTP) OR inserts directly to Supabase `chat_messages` (for Async/Long-running tasks).

## Data Flow

1.  **Initialization**:
    -   Widget loads -> Fetches config from `bot_configurations` using `botId`.
    -   If valid, renders UI with specific colors/text.
    -   Generates or retrieves `sessionId` from LocalStorage.
    -   Loads history from `chat_messages`.
    -   Subscribes to Realtime channel `session:{sessionId}`.

2.  **Sending a Message**:
    -   User types message -> Widget saves to `chat_messages` (optimistic UI).
    -   Widget sends payload to `webhook_url` defined in config.

3.  **Receiving a Message**:
    -   **Path A (Synchronous)**: n8n responds instantly to the webhook request. Widget displays response.
    -   **Path B (Asynchronous)**: n8n takes time (e.g. human in loop). n8n inserts row into `chat_messages`. Supabase Realtime notifies Widget. Widget displays message.

## Security

-   **RLS (Row Level Security)** is enabled.
-   `anon` key is used for client-side operations.
-   Access is scoped by `is_active` flag for configs.
-   Message history is public for insert (to allow unrestricted chatting) but can be scoped to `session_id` if more strict privacy is needed.
