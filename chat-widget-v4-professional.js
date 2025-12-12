// Professional Business Chat Widget - Enterprise Edition
(function () {
    // Default configuration
    const defaultConfig = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '', // Image URL only - no emoji
            name: 'Support',
            welcomeText: 'Welcome! How can we assist you today?',
            responseTimeText: 'Our team typically responds within minutes',
            poweredBy: {
                text: 'Powered by n8n',
                link: 'https://n8n.io'
            }
        },
        style: {
            primaryColor: '#1a73e8',      // Professional blue
            secondaryColor: '#0d47a1',    // Deep blue
            surfaceColor: '#f8f9fa',      // Light background
            backgroundColor: '#ffffff',
            fontColor: '#202124',         // Dark text
            borderColor: '#e0e0e0',
            position: 'right',
        }
    };

    // Merge user config with defaults
    const config = window.ChatWidgetConfig ?
        {
            webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
            branding: {
                ...defaultConfig.branding,
                ...window.ChatWidgetConfig.branding,
                poweredBy: {
                    ...defaultConfig.branding.poweredBy,
                    ...(window.ChatWidgetConfig.branding?.poweredBy || {})
                }
            },
            style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
        } : defaultConfig;

    // Prevent multiple initializations
    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';

    // Inject Inter font (professional, modern)
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(fontLink);

    // Professional, clean, corporate styles
    const styles = `
        .n8n-chat-widget {
            --chat--color-primary: ${config.style.primaryColor};
            --chat--color-secondary: ${config.style.secondaryColor};
            --chat--color-surface: ${config.style.surfaceColor};
            --chat--color-background: ${config.style.backgroundColor};
            --chat--color-font: ${config.style.fontColor};
            --chat--color-border: ${config.style.borderColor};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .n8n-chat-widget .chat-toggle {
            position: fixed;
            bottom: 24px;
            ${config.style.position}: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--chat--color-primary);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            outline: none;
        }
        .n8n-chat-widget .chat-toggle:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
        }
        .n8n-chat-widget .chat-toggle:active {
            transform: translateY(0);
        }
        .n8n-chat-widget .chat-toggle svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        .n8n-chat-widget .chat-container {
            position: fixed;
            bottom: 90px;
            ${config.style.position}: 24px;
            width: 380px;
            max-height: 580px;
            height: 580px;
            border-radius: 12px;
            background: var(--chat--color-background);
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--chat--color-border);
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 1000;
            animation: slideIn 0.25s ease-out;
        }
        .n8n-chat-widget .chat-container.open {
            display: flex;
        }
        @keyframes slideIn {
            from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95); 
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1); 
            }
        }
        .n8n-chat-widget .brand-header {
            padding: 20px 20px 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--chat--color-background);
            border-bottom: 1px solid var(--chat--color-border);
            position: relative;
        }
        .n8n-chat-widget .logo-container {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: var(--chat--color-surface);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
        }
        .n8n-chat-widget .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .n8n-chat-widget .logo-container svg {
            width: 24px;
            height: 24px;
            fill: var(--chat--color-primary);
        }
        .n8n-chat-widget .brand-header span {
            font-size: 16px;
            font-weight: 600;
            color: var(--chat--color-font);
            letter-spacing: -0.2px;
        }
        .n8n-chat-widget .close-button {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--chat--color-font);
            cursor: pointer;
            padding: 6px;
            opacity: 0.6;
            transition: opacity 0.2s;
            font-size: 20px;
            line-height: 1;
            border-radius: 4px;
        }
        .n8n-chat-widget .close-button:hover {
            opacity: 1;
            background: var(--chat--color-surface);
        }
        .n8n-chat-widget .new-conversation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 32px 24px;
            text-align: center;
            width: 100%;
            max-width: 280px;
        }
        .n8n-chat-widget .welcome-text {
            font-size: 20px;
            font-weight: 600;
            color: var(--chat--color-font);
            margin-bottom: 8px;
            line-height: 1.4;
            letter-spacing: -0.3px;
        }
        .n8n-chat-widget .response-text {
            font-size: 14px;
            color: var(--chat--color-font);
            opacity: 0.65;
            margin: 0 0 24px 0;
            font-weight: 400;
            line-height: 1.5;
        }
        .n8n-chat-widget .new-chat-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 12px 20px;
            background: var(--chat--color-primary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            font-weight: 500;
            font-family: inherit;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        .n8n-chat-widget .new-chat-btn:hover {
            background: var(--chat--color-secondary);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        .n8n-chat-widget .new-chat-btn:active {
            transform: translateY(1px);
        }
        .n8n-chat-widget .message-icon {
            width: 18px;
            height: 18px;
        }
        .n8n-chat-widget .chat-interface {
            display: none;
            flex-direction: column;
            height: 100%;
        }
        .n8n-chat-widget .chat-interface.active {
            display: flex;
        }
        .n8n-chat-widget .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--chat--color-surface);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .n8n-chat-widget .chat-messages::-webkit-scrollbar {
            width: 6px;
        }
        .n8n-chat-widget .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        .n8n-chat-widget .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
        }
        .n8n-chat-widget .chat-message {
            max-width: 75%;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.5;
            word-break: break-word;
            animation: messageSlide 0.2s ease-out;
        }
        .n8n-chat-widget .chat-message.user {
            background: var(--chat--color-primary);
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 3px;
        }
        .n8n-chat-widget .chat-message.bot {
            background: var(--chat--color-background);
            color: var(--chat--color-font);
            align-self: flex-start;
            border: 1px solid var(--chat--color-border);
            border-bottom-left-radius: 3px;
        }
        @keyframes messageSlide {
            from { 
                opacity: 0;
                transform: translateY(8px); 
            }
            to { 
                opacity: 1;
                transform: translateY(0); 
            }
        }
        .n8n-chat-widget .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: var(--chat--color-background);
            border: 1px solid var(--chat--color-border);
            border-radius: 10px;
            border-bottom-left-radius: 3px;
            align-self: flex-start;
            max-width: 60px;
        }
        .n8n-chat-widget .typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--chat--color-primary);
            animation: typing-bounce 1.4s infinite ease-in-out;
        }
        .n8n-chat-widget .typing-dot:nth-child(1) {
            animation-delay: -0.32s;
        }
        .n8n-chat-widget .typing-dot:nth-child(2) {
            animation-delay: -0.16s;
        }
        @keyframes typing-bounce {
            0%, 80%, 100% {
                transform: scale(0);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
        .n8n-chat-widget .chat-input {
            padding: 16px 20px;
            background: var(--chat--color-background);
            border-top: 1px solid var(--chat--color-border);
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }
        .n8n-chat-widget .chat-input textarea {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid var(--chat--color-border);
            border-radius: 8px;
            background: var(--chat--color-background);
            color: var(--chat--color-font);
            resize: none;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            line-height: 1.5;
            max-height: 120px;
        }
        .n8n-chat-widget .chat-input textarea:focus {
            border-color: var(--chat--color-primary);
        }
        .n8n-chat-widget .chat-input textarea::placeholder {
            color: var(--chat--color-font);
            opacity: 0.5;
        }
        .n8n-chat-widget .chat-input button {
            background: var(--chat--color-primary);
            color: white;
            border: none;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .n8n-chat-widget .chat-input button:hover {
            background: var(--chat--color-secondary);
        }
        .n8n-chat-widget .chat-input button:active {
            transform: scale(0.95);
        }
        .n8n-chat-widget .chat-input button svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }
        .n8n-chat-widget .chat-footer {
            padding: 12px 20px;
            text-align: center;
            background: var(--chat--color-background);
            border-top: 1px solid var(--chat--color-border);
        }
        .n8n-chat-widget .chat-footer a {
            color: var(--chat--color-font);
            text-decoration: none;
            font-size: 12px;
            opacity: 0.55;
            transition: opacity 0.2s;
            font-family: inherit;
            font-weight: 400;
        }
        .n8n-chat-widget .chat-footer a:hover {
            opacity: 0.8;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    document.body.appendChild(widgetContainer);

    // Chat toggle (FAB)
    const toggleButton = document.createElement('button');
    toggleButton.className = 'chat-toggle';
    toggleButton.setAttribute('aria-label', 'Open chat');
    toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
    `;
    widgetContainer.appendChild(toggleButton);

    // Chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    widgetContainer.appendChild(chatContainer);

    // Determine logo display
    const logoContent = config.branding.logo && config.branding.logo.startsWith('http')
        ? `<img src="${config.branding.logo}" alt="${config.branding.name}">`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>`;

    // New conversation screen
    const newConversationHTML = `
        <div class="brand-header">
            <div class="logo-container">${logoContent}</div>
            <span>${config.branding.name}</span>
            <button class="close-button" aria-label="Close chat">×</button>
        </div>
        <div class="new-conversation">
            <h2 class="welcome-text">${config.branding.welcomeText}</h2>
            <p class="response-text">${config.branding.responseTimeText}</p>
            <button class="new-chat-btn">
                <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                Start conversation
            </button>
        </div>
    `;

    // Chat interface
    const chatInterfaceHTML = `
        <div class="chat-interface">
            <div class="brand-header">
                <div class="logo-container">${logoContent}</div>
                <span>${config.branding.name}</span>
                <button class="close-button" aria-label="Close chat">×</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type a message..." rows="1"></textarea>
                <button type="submit" aria-label="Send message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
            <div class="chat-footer">
                <a href="${config.branding.poweredBy.link}" target="_blank" rel="noopener">${config.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

    // DOM references
    const newChatBtn = chatContainer.querySelector('.new-chat-btn');
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');
    const closeButtons = chatContainer.querySelectorAll('.close-button');

    // UUID generation
    function generateUUID() {
        return crypto.randomUUID();
    }

    // Typing animation helpers
    function showTypingAnimation() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'bot-typing';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingAnimation() {
        const typingEl = document.getElementById('bot-typing');
        if (typingEl) typingEl.remove();
    }

    // Character-by-character typing animation
    async function typeMessage(message, messageElement, speed = 15) {
        const text = message;
        messageElement.textContent = '';

        for (let i = 0; i < text.length; i++) {
            messageElement.textContent += text[i];
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }

    // Auto-resize textarea
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Start new conversation
    async function startNewConversation() {
        currentSessionId = generateUUID();
        const data = [{
            action: "loadPreviousSession",
            sessionId: currentSessionId,
            route: config.webhook.route,
            metadata: {
                userId: ""
            }
        }];

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();
            chatContainer.querySelector('.brand-header').style.display = 'none';
            chatContainer.querySelector('.new-conversation').style.display = 'none';
            chatInterface.classList.add('active');

            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            const botResponse = Array.isArray(responseData) ? responseData[0].output : responseData.output;
            messagesContainer.appendChild(botMessageDiv);

            // Type out the initial message
            await typeMessage(botResponse, botMessageDiv, 15);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error:', error);
            chatContainer.querySelector('.brand-header').style.display = 'none';
            chatContainer.querySelector('.new-conversation').style.display = 'none';
            chatInterface.classList.add('active');

            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'chat-message bot';
            errorMessageDiv.textContent = 'Unable to connect. Please try again later.';
            messagesContainer.appendChild(errorMessageDiv);
        }
    }

    // Send message with natural delays
    async function sendMessage(message) {
        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            route: config.webhook.route,
            chatInput: message,
            metadata: {
                userId: ""
            }
        };

        // Add user message immediately
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Wait 300ms before showing typing indicator
        await new Promise(resolve => setTimeout(resolve, 300));

        showTypingAnimation();

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const data = await response.json();
            const botResponse = Array.isArray(data) ? data[0].output : data.output;

            // Remove typing animation after 800ms
            setTimeout(() => {
                removeTypingAnimation();

                // Create bot message element
                const botMessageDiv = document.createElement('div');
                botMessageDiv.className = 'chat-message bot';
                messagesContainer.appendChild(botMessageDiv);

                // Type out the response
                typeMessage(botResponse, botMessageDiv, 15);
            }, 800);

        } catch (error) {
            removeTypingAnimation();
            console.error('Error:', error);

            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'chat-message bot';
            errorMessageDiv.textContent = 'Unable to send message. Please try again.';
            messagesContainer.appendChild(errorMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Event listeners
    toggleButton.addEventListener('click', () => {
        chatContainer.classList.toggle('open');
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            chatContainer.classList.remove('open');
        });
    });

    newChatBtn.addEventListener('click', startNewConversation);

    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message) {
            sendMessage(message);
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    });

    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message) {
                sendMessage(message);
                textarea.value = '';
                textarea.style.height = 'auto';
            }
        }
    });
})();
