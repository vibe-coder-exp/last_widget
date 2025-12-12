# ================================================================
# N8N WEBHOOK SETUP GUIDE
# ================================================================
# This guide shows you how to set up your n8n workflow to receive
# messages from the chat widget and send responses back.
# ================================================================

## WHAT THE WIDGET SENDS TO YOUR WEBHOOK:
# ================================================================

The widget sends a POST request with this JSON structure:

{
  "action": "sendMessage",
  "sessionId": "abc-123-uuid-456",
  "chatInput": "User's message here",
  "route": "realestate"
}

## CURL COMMAND TO TEST YOUR N8N WEBHOOK:
# ================================================================

curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/your-webhook-id/chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sendMessage",
    "sessionId": "test-session-123",
    "chatInput": "Hello, I need help finding a property",
    "route": "realestate"
  }'

## WHAT N8N SHOULD RETURN:
# ================================================================

Your n8n workflow MUST return JSON in this format:

{
  "output": "Your bot response message here"
}

OR if you're using an array:

[
  {
    "output": "Your bot response message here"
  }
]

## N8N WORKFLOW STRUCTURE:
# ================================================================

1. **Webhook Node (Trigger)**
   - Method: POST
   - Path: /chat
   - Response Mode: "When Last Node Finishes" (IMPORTANT!)
   - Response Data: "First Entry JSON"

2. **Your Logic Nodes**
   - Extract message: {{ $json.chatInput }}
   - Extract sessionId: {{ $json.sessionId }}
   - Process with AI/Database/Logic

3. **Respond to Webhook Node**
   - Return: 
   {
     "output": "{{ $json.aiResponse }}"
   }

## EXAMPLE N8N WORKFLOW (Simple Echo Bot):
# ================================================================

Node 1: Webhook
  - Trigger on POST /chat
  
Node 2: Set Node
  - Create response:
    {
      "output": "You said: {{ $json.chatInput }}"
    }

Node 3: Respond to Webhook
  - Return the output

## EXAMPLE N8N WORKFLOW (OpenAI Integration):
# ================================================================

Node 1: Webhook (Trigger)
  - POST /chat

Node 2: OpenAI Chat Node
  - Model: gpt-3.5-turbo
  - Messages:
    - System: "You are a helpful real estate assistant"
    - User: {{ $json.chatInput }}

Node 3: Set Node
  - Create response:
    {
      "output": "{{ $json.message.content }}"
    }

Node 4: Respond to Webhook
  - Return the output

## TESTING YOUR WEBHOOK:
# ================================================================

# Test with curl (replace URL with yours):
curl -X POST https://googol30.app.n8n.cloud/webhook/87580932-4b72-45d2-a207-31eb2c609951/chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sendMessage",
    "sessionId": "test-123",
    "chatInput": "What properties do you have?",
    "route": "realestate"
  }'

# Expected Response:
{
  "output": "We have many great properties! What type are you looking for?"
}

## SESSION MANAGEMENT (Advanced):
# ================================================================

Use sessionId to maintain conversation context:

1. Save sessionId in database/memory
2. Retrieve previous messages based on sessionId
3. Pass conversation history to AI

Example with sessionId tracking:
{
  "sessionId": "abc-123",
  "previousMessages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"}
  ],
  "currentMessage": "I need a 3 bedroom house"
}

## COMMON ERRORS & SOLUTIONS:
# ================================================================

❌ Error: "Invalid JSON response from webhook"
✅ Solution: Make sure you're returning {"output": "text"}

❌ Error: "Webhook timeout"
✅ Solution: Change Response Mode to "When Last Node Finishes"

❌ Error: "No bot response found"
✅ Solution: Ensure your response has "output" field

❌ Error: 500 Internal Server Error
✅ Solution: Check n8n execution logs for the actual error

## QUICK START - MINIMAL N8N WORKFLOW:
# ================================================================

1. Create new workflow in n8n
2. Add Webhook node:
   - Method: POST
   - Path: /chat
   - Response Mode: "When Last Node Finishes"

3. Add Set node (connect to webhook):
   - Click "Add Value"
   - Name: output
   - Value: "Hello! You said: {{ $json.chatInput }}"

4. Add "Respond to Webhook" node (connect to Set)
   - Response Data: "First Entry JSON"

5. Activate workflow
6. Copy webhook URL
7. Update in Supabase:
   UPDATE bot_configurations 
   SET webhook_url = 'your-webhook-url'
   WHERE bot_id = 'your-bot-id';

8. Test it!

## EXAMPLE RESPONSES FOR REAL ESTATE BOT:
# ================================================================

Welcome Message:
{
  "output": "🏡 Welcome to Elite Realty! I can help you find properties, schedule viewings, or answer questions. What are you looking for?"
}

Property Search:
{
  "output": "Great! I found 12 properties matching your criteria. Here are the top 3:\n\n1. Modern 3BR Villa - $450,000\n2. Luxury Apartment - $320,000\n3. Spacious Townhouse - $380,000\n\nWould you like more details on any of these?"
}

Scheduling:
{
  "output": "Perfect! I can schedule a viewing for you. What date and time works best? (e.g., Tomorrow at 3 PM)"
}

================================================================
Need help? Questions?
- Test webhook: Use curl command above
- Check n8n logs: Executions tab
- Debug: Add "Edit Fields" node to see what data you're getting
================================================================
