(function () {
    'use strict';

    // Extract bot ID from script tag URL parameter
    function getBotId() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            const src = script.src;
            if (src && (src.includes('chat-widget.js') || src.includes('chat-widget-realtime.js'))) {
                const url = new URL(src);
                const botId = url.searchParams.get('botId');
                if (botId) return botId;
            }
        }
        return null;
    }

    // Supabase configuration loaded from config.js (generated from .env)
    const SUPABASE_URL = window.SUPABASE_CONFIG?.url || '';
    const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || '';

    // Prevent multiple initializations
    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';
    let config = null;
    let supabaseClient = null;
    let realtimeChannel = null;

    // Loading indicator HTML
    const loadingHTML = `
        <div class="chat-widget-loading">
            <div class="loading-spinner"></div>
            <p>Loading chat...</p>
        </div>
    `;

    // Error screen HTML
    const errorHTML = (message) => `
        <div class="chat-widget-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                <path fill="#dc3545" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>${message}</p>
        </div>
    `;

    // Fetch bot configuration from Supabase
    async function loadBotConfiguration(botId) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/bot_configurations?bot_id=eq.${botId}&is_active=eq.true&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load configuration');
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error('Bot configuration not found');
            }

            return transformConfig(data[0]);
        } catch (error) {
            console.error('Configuration load error:', error);
            throw error;
        }
    }

    // Transform database config to widget format
    function transformConfig(dbConfig) {
        return {
            webhook: {
                url: dbConfig.webhook_url,
                route: dbConfig.webhook_route || 'general',
                retryAttempts: dbConfig.webhook_retry_attempts || 3,
                timeoutMs: dbConfig.webhook_timeout_ms || 30000
            },
            branding: {
                name: dbConfig.name || 'Support',
                companyName: dbConfig.company_name,
                logo: dbConfig.logo_url,
                favicon: dbConfig.favicon_url,
                welcomeText: dbConfig.welcome_text,
                responseTimeText: dbConfig.response_time_text,
                placeholderText: dbConfig.placeholder_text || dbConfig.input_placeholder_text,
                startButtonText: dbConfig.start_button_text,
                poweredBy: {
                    show: dbConfig.footer_show !== false,
                    text: dbConfig.footer_text,
                    link: dbConfig.footer_link,
                    newTab: dbConfig.footer_link_new_tab !== false
                }
            },
            messages: {
                errorConnection: dbConfig.error_message_connection,
                errorSend: dbConfig.error_message_send,
                errorConfig: dbConfig.error_message_config
            },
            header: {
                showLogo: dbConfig.header_show_logo !== false,
                showName: dbConfig.header_show_name !== false,
                showStatus: dbConfig.header_show_status === true,
                statusText: dbConfig.header_status_text,
                backgroundColor: dbConfig.header_background_color,
                textColor: dbConfig.header_text_color
            },
            footer: {
                backgroundColor: dbConfig.footer_background_color,
                textColor: dbConfig.footer_text_color
            },
            style: {
                primaryColor: dbConfig.primary_color || '#1a73e8',
                secondaryColor: dbConfig.secondary_color || '#0d47a1',
                accentColor: dbConfig.accent_color || '#34a853',
                surfaceColor: dbConfig.surface_color || '#f8f9fa',
                backgroundColor: dbConfig.background_color || '#ffffff',
                fontColor: dbConfig.font_color || '#202124',
                borderColor: dbConfig.border_color || '#e0e0e0',
                userMessageBg: dbConfig.user_message_bg || dbConfig.primary_color,
                userMessageText: dbConfig.user_message_text || '#ffffff',
                botMessageBg: dbConfig.bot_message_bg || '#ffffff',
                botMessageText: dbConfig.bot_message_text || '#202124',
                position: dbConfig.position || 'right',
                fontFamily: dbConfig.font_family || 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: dbConfig.font_size_base || 14
            },
            dimensions: {
                width: dbConfig.widget_width || 380,
                height: dbConfig.widget_height || 580,
                maxWidth: dbConfig.widget_max_width || 380,
                maxHeight: dbConfig.widget_max_height || 580,
                bottomOffset: dbConfig.bottom_offset || 24,
                sideOffset: dbConfig.side_offset || 24,
                toggleButtonSize: dbConfig.toggle_button_size || 56
            },
            ui: {
                widgetBorderRadius: dbConfig.widget_border_radius || 12,
                messageBorderRadius: dbConfig.message_border_radius || 10,
                buttonBorderRadius: dbConfig.button_border_radius || 8,
                toggleButtonBorderRadius: dbConfig.toggle_button_border_radius || 50,
                enableAnimations: dbConfig.enable_animations !== false,
                animationDuration: dbConfig.animation_duration_ms || 200,
                enableTypingAnimation: dbConfig.enable_typing_animation !== false,
                typingSpeed: dbConfig.typing_speed_ms || 15,
                showBotAvatar: dbConfig.show_bot_avatar === true,
                botAvatarUrl: dbConfig.bot_avatar_url,
                showUserAvatar: dbConfig.show_user_avatar === true,
                showTimestamp: dbConfig.show_timestamp === true,
                showWelcomeScreen: dbConfig.show_welcome_screen !== false,
                welcomeSubtitle: dbConfig.welcome_screen_subtitle
            },
            input: {
                maxLength: dbConfig.input_max_length || 2000,
                rows: dbConfig.input_rows || 1,
                maxRows: dbConfig.input_max_rows || 5
            },
            behavior: {
                autoOpenOnLoad: dbConfig.auto_open_on_load === true,
                autoOpenDelay: dbConfig.auto_open_delay_ms || 0,
                rememberConversation: dbConfig.remember_conversation !== false
            },
            customCss: dbConfig.custom_css
        };
    }

    // UUID generation
    function generateUUID() {
        return crypto.randomUUID();
    }

    // Helper: Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: Format message (Links & Newlines)
    function formatMessage(text) {
        // 1. Escape HTML first
        let safeText = escapeHtml(text);
        
        // 2. Convert URLs to links
        safeText = safeText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
        });
        
        // 3. Convert newlines
        safeText = safeText.replace(/\n/g, '<br>');
        
        return safeText;
    }

    // Initialize widget
    async function initializeWidget() {
        const botId = getBotId();

        if (!botId) {
            document.body.innerHTML += errorHTML('Bot ID not provided. Please add ?botId=your-bot-id to the script URL.');
            return;
        }

        // Create container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'n8n-chat-widget';
        widgetContainer.innerHTML = loadingHTML;
        document.body.appendChild(widgetContainer);

        try {
            // Load configuration
            config = await loadBotConfiguration(botId);

            // Inject font
            if (config.style.fontFamily.includes('Inter')) {
                const fontLink = document.createElement('link');
                fontLink.rel = 'stylesheet';
                fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
                document.head.appendChild(fontLink);
            }

            // Inject styles
            injectStyles();

            // Build widget
            buildWidget(widgetContainer);

            // Auto-open if configured
            if (config.behavior.autoOpenOnLoad) {
                setTimeout(() => {
                    const chatContainer = widgetContainer.querySelector('.chat-container');
                    if (chatContainer) chatContainer.classList.add('open');
                }, config.behavior.autoOpenDelay);
            }

        } catch (error) {
            widgetContainer.innerHTML = errorHTML(config?.messages?.errorConfig || 'Failed to load chat configuration');
        }
    }

    // Initialize Supabase Client
    function initSupabase() {
        if (window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('❌ Supabase JS client not found. Realtime features disabled.');
        }
    }

    // Subscribe to Realtime Messages
    function subscribeToMessages(messagesContainer) {
        if (!supabaseClient || !currentSessionId) return;

        // Cleanup previous subscription
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = supabaseClient
            .channel(`session:${currentSessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${currentSessionId}`
                },
                (payload) => {
                    const msg = payload.new;

                    // Only show if it's NOT from 'user' (we show user messages immediately locally)
                    if (msg.sender_type !== 'user') {
                        // Prevent duplicates (webhook vs realtime) and ignore welcome messages
                        if (msg.sender_type === 'agent' || (msg.sender_type === 'bot' && !msg.metadata?.is_webhook_response && !msg.metadata?.is_welcome)) {
                            const botMessageDiv = document.createElement('div');
                            botMessageDiv.className = 'chat-message bot';
                            botMessageDiv.innerHTML = formatMessage(msg.content);
                            messagesContainer.appendChild(botMessageDiv);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    }
                }
            )
            .subscribe((status) => {
                // Subscription status
            });
    }

    // Helper: Save message to DB
    async function saveMessageToDB(content, senderType, metadata = {}) {
        if (!supabaseClient) return;

        try {
            const { error } = await supabaseClient
                .from('chat_messages')
                .insert({
                    session_id: currentSessionId,
                    bot_id: getBotId(),
                    content: content,
                    sender_type: senderType,
                    metadata: metadata
                });

            if (error) console.error('❌ Error saving message to DB:', error);
        } catch (err) {
            console.error('❌ DB Save Exception:', err);
        }
    }

    // Inject dynamic styles based on configuration
    function injectStyles() {
        const styles = `
            .n8n-chat-widget {
                --chat--color-primary: ${config.style.primaryColor};
                --chat--color-secondary: ${config.style.secondaryColor};
                --chat--color-accent: ${config.style.accentColor};
                --chat--color-surface: ${config.style.surfaceColor};
                --chat--color-background: ${config.style.backgroundColor};
                --chat--color-font: ${config.style.fontColor};
                --chat--color-border: ${config.style.borderColor};
                --chat--user-msg-bg: ${config.style.userMessageBg};
                --chat--user-msg-text: ${config.style.userMessageText};
                --chat--bot-msg-bg: ${config.style.botMessageBg};
                --chat--bot-msg-text: ${config.style.botMessageText};
                font-family: ${config.style.fontFamily};
                font-size: ${config.style.fontSize}px;
            }

            .chat-widget-loading, .chat-widget-error {
                position: fixed;
                bottom: ${config.dimensions.bottomOffset}px;
                ${config.style.position}: ${config.dimensions.sideOffset}px;
                background: white;
                padding: 24px;
                border-radius: ${config.ui.widgetBorderRadius}px;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
                text-align: center;
                z-index: 1000;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--chat--color-surface);
                border-top-color: var(--chat--color-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 12px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .chat-widget-error svg {
                margin-bottom: 12px;
            }

            .chat-widget-error p, .chat-widget-loading p {
                margin: 0;
                color: var(--chat--color-font);
                font-size: 14px;
            }

            .n8n-chat-widget .chat-toggle {
                position: fixed;
                bottom: ${config.dimensions.bottomOffset}px;
                ${config.style.position}: ${config.dimensions.sideOffset}px;
                width: ${config.dimensions.toggleButtonSize}px;
                height: ${config.dimensions.toggleButtonSize}px;
                border-radius: ${config.ui.toggleButtonBorderRadius}%;
                background: var(--chat--color-primary);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all ${config.ui.animationDuration}ms ease;
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
                bottom: ${config.dimensions.bottomOffset + config.dimensions.toggleButtonSize + 16}px;
                ${config.style.position}: ${config.dimensions.sideOffset}px;
                width: ${config.dimensions.width}px;
                max-width: ${config.dimensions.maxWidth}px;
                height: ${config.dimensions.height}px;
                max-height: ${config.dimensions.maxHeight}px;
                border-radius: ${config.ui.widgetBorderRadius}px;
                background: var(--chat--color-background);
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
                border: 1px solid var(--chat--color-border);
                overflow: hidden;
                display: none;
                flex-direction: column;
                z-index: 1000;
                ${config.ui.enableAnimations ? `animation: slideIn ${config.ui.animationDuration}ms ease-out;` : ''}
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
                background: ${config.header.backgroundColor || 'var(--chat--color-background)'};
                color: ${config.header.textColor || 'var(--chat--color-font)'};
                border-bottom: 1px solid var(--chat--color-border);
                position: relative;
            }

            .n8n-chat-widget .logo-container {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: var(--chat--color-surface);
                display: ${config.header.showLogo ? 'flex' : 'none'};
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

            .n8n-chat-widget .brand-header-text {
                flex: 1;
                ${config.header.showName ? '' : 'display: none;'}
            }

            .n8n-chat-widget .brand-header span {
                font-size: 16px;
                font-weight: 600;
                letter-spacing: -0.2px;
                display: block;
            }

            .n8n-chat-widget .brand-status {
                font-size: 12px;
                opacity: 0.6;
                display: ${config.header.showStatus ? 'block' : 'none'};
                margin-top: 2px;
            }

            .n8n-chat-widget .close-button {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                padding: 8px;
                opacity: 0.7;
                transition: all ${config.ui.animationDuration}ms;
                font-size: 24px;
                line-height: 1;
                border-radius: 6px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .n8n-chat-widget .close-button:hover {
                opacity: 1;
                background: var(--chat--color-surface);
                transform: scale(1.05);
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
                ${config.ui.showWelcomeScreen ? '' : 'display: none;'}
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
                border-radius: ${config.ui.buttonBorderRadius}px;
                cursor: pointer;
                font-size: 14px;
                transition: all ${config.ui.animationDuration}ms ease;
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
                border-radius: ${config.ui.messageBorderRadius}px;
                font-size: inherit;
                line-height: 1.5;
                word-break: break-word;
                ${config.ui.enableAnimations ? `animation: messageSlide ${config.ui.animationDuration}ms ease-out;` : ''}
            }

            .n8n-chat-widget .chat-message.user {
                background: var(--chat--user-msg-bg);
                color: var(--chat--user-msg-text);
                align-self: flex-end;
                border-bottom-right-radius: 3px;
            }

            .n8n-chat-widget .chat-message.bot {
                background: var(--chat--bot-msg-bg);
                color: var(--chat--bot-msg-text);
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

            .n8n-chat-widget .chat-message a.chat-link {
                text-decoration: underline;
                word-break: break-all;
            }

            .n8n-chat-widget .chat-message.bot a.chat-link {
                color: var(--chat--color-primary);
            }

            .n8n-chat-widget .chat-message.user a.chat-link {
                color: inherit;
                opacity: 0.95;
            }

            .n8n-chat-widget .typing-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 12px 16px;
                background: var(--chat--bot-msg-bg);
                border: 1px solid var(--chat--color-border);
                border-radius: ${config.ui.messageBorderRadius}px;
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
                border-radius: ${config.ui.buttonBorderRadius}px;
                background: var(--chat--color-background);
                color: var(--chat--color-font);
                resize: none;
                font-family: inherit;
                font-size: inherit;
                outline: none;
                transition: border-color ${config.ui.animationDuration}ms;
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
                border-radius: ${config.ui.buttonBorderRadius}px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all ${config.ui.animationDuration}ms;
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
                background: ${config.footer.backgroundColor || 'var(--chat--color-background)'};
                border-top: 1px solid var(--chat--color-border);
                ${config.branding.poweredBy.show ? '' : 'display: none;'}
            }

            .n8n-chat-widget .chat-footer a {
                color: ${config.footer.textColor || 'var(--chat--color-font)'};
                text-decoration: none;
                font-size: 12px;
                opacity: 0.55;
                transition: opacity ${config.ui.animationDuration}ms;
                font-family: inherit;
                font-weight: 400;
            }

            .n8n-chat-widget .chat-footer a:hover {
                opacity: 0.8;
            }

            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                .n8n-chat-widget .chat-toggle {
                    bottom: 20px;
                    ${config.style.position}: 20px;
                    width: 56px;
                    height: 56px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                }

                .n8n-chat-widget .chat-toggle svg {
                    width: 28px;
                    height: 28px;
                }

                .n8n-chat-widget .chat-container {
                    bottom: 0 !important;
                    ${config.style.position}: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: 100% !important;
                    max-height: 100vh !important;
                    border-radius: 0 !important;
                    border: none !important;
                }

                .n8n-chat-widget .brand-header {
                    padding: 16px;
                }

                .n8n-chat-widget .close-button {
                    width: 48px;
                    height: 48px;
                    font-size: 28px;
                }

                .n8n-chat-widget .logo-container {
                    width: 36px;
                    height: 36px;
                }

                .n8n-chat-widget .brand-header span {
                    font-size: 15px;
                }

                .n8n-chat-widget .brand-status {
                    font-size: 11px;
                }

                .n8n-chat-widget .new-conversation {
                    padding: 24px 20px;
                    max-width: 100%;
                }

                .n8n-chat-widget .welcome-text {
                    font-size: 18px;
                }

                .n8n-chat-widget .response-text {
                    font-size: 13px;
                }

                .n8n-chat-widget .chat-messages {
                    padding: 16px;
                }

                .n8n-chat-widget .chat-message {
                    max-width: 85%;
                    font-size: 15px;
                    padding: 10px 14px;
                }

                .n8n-chat-widget .chat-input {
                    padding: 12px 16px;
                }

                .n8n-chat-widget .chat-input textarea {
                    font-size: 16px; /* Prevents zoom on iOS */
                    padding: 12px;
                }

                .n8n-chat-widget .chat-input button {
                    width: 44px;
                    height: 44px;
                    min-width: 44px;
                }

                .n8n-chat-widget .chat-input button svg {
                    width: 20px;
                    height: 20px;
                }

                .n8n-chat-widget .new-chat-btn {
                    padding: 14px 24px;
                    font-size: 15px;
                    min-height: 48px;
                }

                .n8n-chat-widget .chat-footer {
                    padding: 10px 16px;
                }

                .chat-widget-loading, .chat-widget-error {
                    bottom: 20px !important;
                    ${config.style.position}: 20px !important;
                    padding: 20px;
                    max-width: calc(100% - 40px);
                }
            }

            /* Small mobile devices */
            @media (max-width: 480px) {
                .n8n-chat-widget .chat-message {
                    max-width: 90%;
                }

                .n8n-chat-widget .brand-header {
                    padding: 14px;
                }

                .n8n-chat-widget .chat-messages {
                    padding: 12px;
                }

                .n8n-chat-widget .chat-input {
                    padding: 10px 12px;
                }
            }

            /* Landscape mobile */
            @media (max-width: 768px) and (orientation: landscape) {
                .n8n-chat-widget .chat-container {
                    max-height: 100vh !important;
                }

                .n8n-chat-widget .chat-messages {
                    padding: 12px;
                }
            }

            /* Touch device improvements */
            @media (hover: none) and (pointer: coarse) {
                .n8n-chat-widget .chat-toggle {
                    width: 60px;
                    height: 60px;
                }

                .n8n-chat-widget .chat-input button,
                .n8n-chat-widget .close-button,
                .n8n-chat-widget .new-chat-btn {
                    min-height: 44px;
                    min-width: 44px;
                }
            }

            ${config.customCss || ''}
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Build widget UI
    function buildWidget(container) {
        container.innerHTML = '';

        // Toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'chat-toggle';
        toggleButton.setAttribute('aria-label', 'Open chat');
        toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
        `;
        container.appendChild(toggleButton);

        // Chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        container.appendChild(chatContainer);

        // Logo content
        const logoContent = config.branding.logo
            ? `<img src="${config.branding.logo}" alt="${config.branding.name}">`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>`;

        // New conversation screen
        const newConversationHTML = `
            <div class="brand-header">
                <div class="logo-container">${logoContent}</div>
                <div class="brand-header-text">
                    <span>${config.branding.name}</span>
                    ${config.header.showStatus ? `<div class="brand-status">${config.header.statusText}</div>` : ''}
                </div>
                <button class="close-button" aria-label="Close chat">×</button>
            </div>
            <div class="new-conversation">
                <h2 class="welcome-text">${config.branding.welcomeText}</h2>
                <p class="response-text">${config.branding.responseTimeText}</p>
                <button class="new-chat-btn">
                    <svg class="message-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                    ${config.branding.startButtonText}
                </button>
            </div>
        `;

        // Chat interface
        const chatInterfaceHTML = `
            <div class="chat-interface">
                <div class="brand-header">
                    <div class="logo-container">${logoContent}</div>
                    <div class="brand-header-text">
                        <span>${config.branding.name}</span>
                        ${config.header.showStatus ? `<div class="brand-status">${config.header.statusText}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="reset-button" aria-label="Start new chat" title="Start New Chat" style="background:none; border:none; cursor:pointer; padding:8px; opacity:0.7; color:currentColor; display:flex; align-items:center;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                        <button class="close-button" aria-label="Close chat">×</button>
                    </div>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <textarea placeholder="${config.branding.placeholderText}" rows="${config.input.rows}" maxlength="${config.input.maxLength}"></textarea>
                    <button type="submit" aria-label="Send message">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
                <div class="chat-footer">
                    <a href="${config.branding.poweredBy.link}" target="${config.branding.poweredBy.newTab ? '_blank' : '_self'}" rel="noopener">${config.branding.poweredBy.text}</a>
                </div>
            </div>
        `;

        chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

        // Setup event listeners
        setupEventListeners(container);
    }

    // Setup event listeners
    function setupEventListeners(container) {
        const toggleButton = container.querySelector('.chat-toggle');
        const chatContainer = container.querySelector('.chat-container');
        const newChatBtn = container.querySelector('.new-chat-btn');
        const chatInterface = container.querySelector('.chat-interface');
        const messagesContainer = container.querySelector('.chat-messages');
        const textarea = container.querySelector('textarea');
        const sendButton = container.querySelector('button[type="submit"]');
        const closeButtons = container.querySelectorAll('.close-button');

        // Auto-resize textarea
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            const maxHeight = config.input.maxRows * 24; // Approximate line height
            this.style.height = Math.min(this.scrollHeight, maxHeight) + 'px';
        });

        // Toggle chat
        toggleButton.addEventListener('click', () => {
            chatContainer.classList.toggle('open');
        });

        // Close buttons
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                chatContainer.classList.remove('open');
            });
        });

        // Reset Button
        const resetButton = container.querySelector('.reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                const confirmed = confirm('Start a new conversation? This will clear your current chat history.');
                if (confirmed) {
                    // Clear local storage for this bot
                    localStorage.removeItem(`n8n_chat_session_${config.branding.botId || getBotId()}`);
                    // Clear UI
                    messagesContainer.innerHTML = '';
                    // Start fresh
                    startNewConversation(chatContainer, chatInterface, messagesContainer, null);
                }
            });
        }

        // Start conversation (New Chat Button -> Forces NEW session)
        newChatBtn.addEventListener('click', () => {
            // Clear local storage for this bot
            localStorage.removeItem(`n8n_chat_session_${config.branding.botId || getBotId()}`);
            // Clear UI
            messagesContainer.innerHTML = '';
            // Start fresh
            startNewConversation(chatContainer, chatInterface, messagesContainer, null);
        });

        // Auto-Resume logic (Check local storage)
        const savedSessionId = localStorage.getItem(`n8n_chat_session_${config.branding.botId || getBotId()}`);
        if (savedSessionId && config.behavior.rememberConversation) {
            // Auto-open if configured, or just prep the UI?
            // If we auto-open, we skip the "Start Chat" screen
            // Let's swap the UI immediately
            startNewConversation(chatContainer, chatInterface, messagesContainer, savedSessionId);

            // Open widget if configured
            if (config.behavior.autoOpenOnLoad) {
                setTimeout(() => chatContainer.classList.add('open'), 500);
            }
        }

        // Send message
        sendButton.addEventListener('click', () => {
            const message = textarea.value.trim();
            if (message) {
                sendMessage(message, messagesContainer);
                textarea.value = '';
                textarea.style.height = 'auto';
            }
        });

        // Enter to send
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = textarea.value.trim();
                if (message) {
                    sendMessage(message, messagesContainer);
                    textarea.value = '';
                    textarea.style.height = 'auto';
                }
            }
        });
    }

    // Typing animation helpers
    function showTypingAnimation(messagesContainer) {
        if (!config.ui.enableTypingAnimation) return null;

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
        return typingIndicator;
    }

    function removeTypingAnimation() {
        const typingEl = document.getElementById('bot-typing');
        if (typingEl) typingEl.remove();
    }

    // Type message character by character
    async function typeMessage(message, messageElement) {
        const formatted = formatMessage(message);

        // If typing disabled, or message has links/formatting, show instantly
        // (Typing animation doesn't work well with HTML tags)
        if (!config.ui.enableTypingAnimation || formatted.includes('<a ') || formatted.includes('<br>')) {
            messageElement.innerHTML = formatted;
            return;
        }

        messageElement.textContent = '';
        const container = messageElement.closest('.chat-messages');

        for (let i = 0; i < message.length; i++) {
            messageElement.textContent += message[i];
            container.scrollTop = container.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, config.ui.typingSpeed));
        }
    }

    // Load chat history from Supabase
    async function loadChatHistory(sessionId, messagesContainer) {
        if (!supabaseClient) return false;

        // Show small loading indicator
        const loader = document.createElement('div');
        loader.className = 'response-text';
        loader.style.textAlign = 'center';
        loader.textContent = 'Loading history...';
        messagesContainer.appendChild(loader);

        try {
            const { data, error } = await supabaseClient
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            loader.remove();

            if (data && data.length > 0) {
                // Determine if the last message was the welcome message to avoid duplicating logic
                // For now, just render them all
                data.forEach(msg => {
                    const msgDiv = document.createElement('div');
                    // Map sender_type to CSS class
                    // user -> 'user'
                    // bot -> 'bot'
                    // agent -> 'bot' (or maybe a special 'agent' class later)
                    let className = 'bot';
                    if (msg.sender_type === 'user') className = 'user';

                    msgDiv.className = `chat-message ${className}`;
                    msgDiv.innerHTML = formatMessage(msg.content);
                    messagesContainer.appendChild(msgDiv);
                });

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                return true; // Found history
            }
        } catch (err) {
            console.error('❌ Error loading history:', err);
            loader.textContent = 'Failed to load history';
        }
        return false; // No history found
    }

    // Start conversation (New or Resume)
    async function startNewConversation(chatContainer, chatInterface, messagesContainer, resumeSessionId = null) {

        let isResuming = false;

        if (resumeSessionId) {
            currentSessionId = resumeSessionId;
            isResuming = true;
        } else {
            // Generate NEW session
            currentSessionId = generateUUID();
            // Save to LocalStorage
            const storageKey = `n8n_chat_session_${config.branding.botId || getBotId()}`;
            localStorage.setItem(storageKey, currentSessionId);
        }

        // Subscribe to Realtime Updates
        subscribeToMessages(messagesContainer);

        // Show chat interface
        chatContainer.querySelector('.brand-header').style.display = 'none';
        chatContainer.querySelector('.new-conversation').style.display = 'none';
        chatInterface.classList.add('active');

        // Check History if resuming
        let historyLoaded = false;
        if (isResuming) {
            historyLoaded = await loadChatHistory(currentSessionId, messagesContainer);
        }

        // Only show welcome message if NOT resuming or if history was empty
        if (!historyLoaded) {
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            messagesContainer.appendChild(botMessageDiv);

            const welcomeMessage = config.branding.welcomeText || 'Hello! How can I help you today?';

            await typeMessage(welcomeMessage, botMessageDiv);

            // Save welcome message to DB so it appears in history next time
            saveMessageToDB(welcomeMessage, 'bot', { is_welcome: true });
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }



    // Send message
    async function sendMessage(message, messagesContainer) {
        // Check message limit first
        try {
            const limitCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_message_count`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ p_bot_id: getBotId() })
            });

            const limitResult = await limitCheckResponse.json();

            if (!limitResult.allowed) {
                console.warn('⚠️ Message limit reached');
                const limitMessageDiv = document.createElement('div');
                limitMessageDiv.className = 'chat-message bot';
                limitMessageDiv.style.background = '#fff3cd';
                limitMessageDiv.style.color = '#856404';
                limitMessageDiv.style.borderColor = '#ffc107';
                limitMessageDiv.textContent = limitResult.message || 'Message limit reached. Please try again later.';
                messagesContainer.appendChild(limitMessageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                return;
            }
        } catch (limitError) {
            console.error('❌ Error checking message limit:', limitError);
            // Continue anyway if limit check fails
        }

        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            botId: getBotId(),
            route: config.webhook.route,
            chatInput: message,
            metadata: { userId: "" }
        };

        // Add user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.innerHTML = formatMessage(message);
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Save USER message to DB
        saveMessageToDB(message, 'user');

        // Show typing indicator
        await new Promise(resolve => setTimeout(resolve, 300));
        const typingIndicator = showTypingAnimation(messagesContainer);

        try {

            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            const responseText = await response.text();

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                throw new Error('Invalid JSON response from webhook');
            }

            const botResponse = Array.isArray(data) ? data[0]?.output : data?.output;

            setTimeout(() => {
                removeTypingAnimation();

                const botMessageDiv = document.createElement('div');
                botMessageDiv.className = 'chat-message bot';
                messagesContainer.appendChild(botMessageDiv);

                if (!botResponse) {
                    botMessageDiv.textContent = 'No response received.';
                } else {
                    typeMessage(botResponse, botMessageDiv);
                    // Save BOT response to DB (marked as webhook response to avoid dupe display)
                    saveMessageToDB(botResponse, 'bot', { is_webhook_response: true });
                }
            }, 800);

        } catch (error) {
            removeTypingAnimation();
            console.error('❌ Send message error:', error);

            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'chat-message bot';
            errorMessageDiv.textContent = config.messages.errorSend + ' (Check console for details)';
            messagesContainer.appendChild(errorMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSupabase(); // Init client first
            initializeWidget();
        });
    } else {
        initSupabase();
        initializeWidget();
    }
})();
