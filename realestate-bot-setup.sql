-- ================================================================
-- REAL ESTATE BOT - Complete Configuration
-- ================================================================
-- A fully configured real estate chatbot with professional branding,
-- custom colors, messages, and all features enabled.
-- ================================================================

INSERT INTO public.bot_configurations (
    -- Bot Identity
    bot_id,
    name,
    company_name,
    
    -- Branding (Logo URLs - Replace with your actual URLs)
    logo_url,
    favicon_url,
    
    -- Messages & Text Content
    welcome_text,
    response_time_text,
    placeholder_text,
    start_button_text,
    
    -- Error Messages
    error_message_connection,
    error_message_send,
    error_message_config,
    
    -- Header Customization
    header_show_logo,
    header_show_name,
    header_show_status,
    header_status_text,
    
    -- Footer Customization
    footer_show,
    footer_text,
    footer_link,
    
    -- Webhook Configuration (Replace with your n8n webhook URL)
    webhook_url,
    webhook_route,
    
    -- Color Scheme - Real Estate Theme (Professional Blue/Green)
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    background_color,
    font_color,
    border_color,
    
    -- Message Bubble Colors
    user_message_bg,
    user_message_text,
    bot_message_bg,
    bot_message_text,
    
    -- Dimensions & Layout
    widget_width,
    widget_height,
    position,
    bottom_offset,
    side_offset,
    toggle_button_size,
    
    -- Typography
    font_family,
    font_size_base,
    
    -- Border Radius
    widget_border_radius,
    message_border_radius,
    button_border_radius,
    
    -- Animations
    enable_animations,
    animation_duration_ms,
    enable_typing_animation,
    typing_speed_ms,
    
    -- Features
    enable_markdown,
    show_timestamp,
    
    -- Welcome Screen
    show_welcome_screen,
    welcome_screen_subtitle,
    
    -- Behavior Settings
    auto_open_on_load,
    remember_conversation,
    conversation_timeout_hours,
    
    -- Message Limits
    monthly_message_limit,
    messages_used_this_month,
    limit_reached_message,
    enable_message_limit,
    
    -- Metadata
    is_active,
    environment
    
) VALUES (
    -- Bot Identity
    'realestate-assistant',
    'Property Assistant',
    'Elite Realty Group',
    
    -- Branding (Replace with your actual logo URLs)
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0yheKLnKYRxBRWAK_8iAIacaSL-M_xyb7BA&s',  -- Your logo URL here
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0yheKLnKYRxBRWAK_8iAIacaSL-M_xyb7BA&s',  -- Your favicon URL here
    
    -- Messages & Text Content
    '🏡 Welcome to Elite Realty! Looking for your dream home? I''m here to help you find the perfect property.',
    'We typically respond within 1-2 minutes',
    'Ask about properties, pricing, or schedule a viewing...',
    'Find My Dream Home',
    
    -- Error Messages
    'Unable to connect. Please check your internet and try again.',
    'Message failed to send. Please try again.',
    'Configuration error. Please refresh the page.',
    
    -- Header Customization
    true,  -- Show logo
    true,  -- Show name
    true,  -- Show status
    '🟢 Available Now',
    
    -- Footer Customization
    true,
    'Powered by Elite Realty AI',
    'https://zameen.com',
    
    -- Webhook Configuration (REPLACE WITH YOUR n8n WEBHOOK URL!)
    'https://googol30.app.n8n.cloud/webhook/87580932-4b72-45d2-a207-31eb2c609951/chat',
    'realestate',
    
    -- Color Scheme - Professional Real Estate Colors
    '#2E7D32',      -- Primary: Forest Green (trust, stability)
    '#1B5E20',      -- Secondary: Dark Green
    '#00897B',      -- Accent: Teal (modern, fresh)
    '#F5F5F5',      -- Surface: Light Gray
    '#FFFFFF',      -- Background: White
    '#212121',      -- Font: Dark Gray
    '#E0E0E0',      -- Border: Light Gray
    
    -- Message Bubble Colors
    '#2E7D32',      -- User message background (green)
    '#FFFFFF',      -- User message text (white)
    '#FFFFFF',      -- Bot message background (white)
    '#212121',      -- Bot message text (dark)
    
    -- Dimensions & Layout
    400,            -- Widget width
    600,            -- Widget height
    'right',        -- Position (right side)
    24,             -- Bottom offset
    24,             -- Side offset
    60,             -- Toggle button size
    
    -- Typography
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    15,             -- Base font size
    
    -- Border Radius
    16,             -- Widget border radius
    12,             -- Message border radius
    8,              -- Button border radius
    
    -- Animations
    true,           -- Enable animations
    250,            -- Animation duration
    true,           -- Enable typing animation
    20,             -- Typing speed
    
    -- Features
    true,           -- Enable markdown
    true,           -- Show timestamp
    
    -- Welcome Screen
    true,
    'Browse properties, get instant answers, or schedule viewings 24/7',
    
    -- Behavior Settings
    false,          -- Don't auto-open
    true,           -- Remember conversation
    48,             -- Conversation timeout (2 days)
    
    -- Message Limits
    5000,           -- Monthly limit (higher for customer inquiries)
    0,              -- Current usage
    'Our chat service has reached its monthly limit. Please email us at info@eliterealty.com or call (555) 123-4567.',
    true,           -- Enable message limit
    
    -- Metadata
    true,           -- Active
    'production'    -- Environment
    
) ON CONFLICT (bot_id) DO UPDATE SET
    name = EXCLUDED.name,
    company_name = EXCLUDED.company_name,
    logo_url = EXCLUDED.logo_url,
    favicon_url = EXCLUDED.favicon_url,
    welcome_text = EXCLUDED.welcome_text,
    response_time_text = EXCLUDED.response_time_text,
    placeholder_text = EXCLUDED.placeholder_text,
    start_button_text = EXCLUDED.start_button_text,
    error_message_connection = EXCLUDED.error_message_connection,
    error_message_send = EXCLUDED.error_message_send,
    error_message_config = EXCLUDED.error_message_config,
    header_show_logo = EXCLUDED.header_show_logo,
    header_show_name = EXCLUDED.header_show_name,
    header_show_status = EXCLUDED.header_show_status,
    header_status_text = EXCLUDED.header_status_text,
    footer_show = EXCLUDED.footer_show,
    footer_text = EXCLUDED.footer_text,
    footer_link = EXCLUDED.footer_link,
    webhook_url = EXCLUDED.webhook_url,
    webhook_route = EXCLUDED.webhook_route,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    surface_color = EXCLUDED.surface_color,
    background_color = EXCLUDED.background_color,
    font_color = EXCLUDED.font_color,
    border_color = EXCLUDED.border_color,
    user_message_bg = EXCLUDED.user_message_bg,
    user_message_text = EXCLUDED.user_message_text,
    bot_message_bg = EXCLUDED.bot_message_bg,
    bot_message_text = EXCLUDED.bot_message_text,
    widget_width = EXCLUDED.widget_width,
    widget_height = EXCLUDED.widget_height,
    position = EXCLUDED.position,
    bottom_offset = EXCLUDED.bottom_offset,
    side_offset = EXCLUDED.side_offset,
    toggle_button_size = EXCLUDED.toggle_button_size,
    font_family = EXCLUDED.font_family,
    font_size_base = EXCLUDED.font_size_base,
    widget_border_radius = EXCLUDED.widget_border_radius,
    message_border_radius = EXCLUDED.message_border_radius,
    button_border_radius = EXCLUDED.button_border_radius,
    enable_animations = EXCLUDED.enable_animations,
    animation_duration_ms = EXCLUDED.animation_duration_ms,
    enable_typing_animation = EXCLUDED.enable_typing_animation,
    typing_speed_ms = EXCLUDED.typing_speed_ms,
    enable_markdown = EXCLUDED.enable_markdown,
    show_timestamp = EXCLUDED.show_timestamp,
    show_welcome_screen = EXCLUDED.show_welcome_screen,
    welcome_screen_subtitle = EXCLUDED.welcome_screen_subtitle,
    auto_open_on_load = EXCLUDED.auto_open_on_load,
    remember_conversation = EXCLUDED.remember_conversation,
    conversation_timeout_hours = EXCLUDED.conversation_timeout_hours,
    monthly_message_limit = EXCLUDED.monthly_message_limit,
    limit_reached_message = EXCLUDED.limit_reached_message,
    enable_message_limit = EXCLUDED.enable_message_limit,
    updated_at = NOW();

-- ================================================================
-- VERIFICATION QUERY
-- Run this to verify the bot was created successfully
-- ================================================================
SELECT 
    bot_id,
    name,
    company_name,
    primary_color,
    is_active,
    monthly_message_limit,
    created_at
FROM public.bot_configurations 
WHERE bot_id = 'realestate-assistant';

-- ================================================================
-- USAGE
-- ================================================================
-- After running this SQL:
-- 
-- 1. Widget popup: 
--    <script src="chat-widget-supabase.js?botId=realestate-assistant"></script>
--
-- 2. Full-screen chat:
--    http://localhost:8000/fullscreen-chat.html?bot_id=realestate-assistant
--
-- 3. Update webhook URL:
--    UPDATE bot_configurations 
--    SET webhook_url = 'https://your-n8n-url.com/webhook/id/chat'
--    WHERE bot_id = 'realestate-assistant';
--
-- 4. Upload your logo and update:
--    UPDATE bot_configurations 
--    SET logo_url = 'https://your-cdn.com/logo.png'
--    WHERE bot_id = 'realestate-assistant';
-- ================================================================
