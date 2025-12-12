-- ================================================================
-- SUPABASE CHAT WIDGET - COMPLETE INITIALIZATION SCRIPT
-- Version: 2.0 (Realtime Enabled)
-- ================================================================

-- 1. CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.bot_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id TEXT UNIQUE NOT NULL,
    
    -- Branding
    name TEXT NOT NULL DEFAULT 'Support',
    company_name TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Text & Messages
    welcome_text TEXT DEFAULT 'Welcome! How can we assist you today?',
    response_time_text TEXT DEFAULT 'Our team typically responds within minutes',
    placeholder_text TEXT DEFAULT 'Type a message...',
    start_button_text TEXT DEFAULT 'Start conversation',
    
    -- Status Indicators
    message_sent_indicator TEXT DEFAULT 'Sent',
    message_delivered_indicator TEXT DEFAULT 'Delivered',
    
    -- Header & Footer
    header_show_logo BOOLEAN DEFAULT true,
    header_show_name BOOLEAN DEFAULT true,
    header_show_status BOOLEAN DEFAULT false,
    header_status_text TEXT DEFAULT 'Online',
    header_background_color TEXT,
    header_text_color TEXT,
    footer_show BOOLEAN DEFAULT true,
    footer_text TEXT DEFAULT 'Powered by n8n',
    footer_link TEXT DEFAULT 'https://n8n.io',
    footer_link_new_tab BOOLEAN DEFAULT true,
    footer_background_color TEXT,
    footer_text_color TEXT,
    
    -- Webhook (n8n Integration)
    webhook_url TEXT NOT NULL,
    webhook_route TEXT DEFAULT 'general',
    webhook_retry_attempts INTEGER DEFAULT 3,
    webhook_timeout_ms INTEGER DEFAULT 30000,
    
    -- Styling
    primary_color TEXT DEFAULT '#1a73e8',
    secondary_color TEXT DEFAULT '#0d47a1',
    accent_color TEXT DEFAULT '#34a853',
    surface_color TEXT DEFAULT '#f8f9fa',
    background_color TEXT DEFAULT '#ffffff',
    font_color TEXT DEFAULT '#202124',
    border_color TEXT DEFAULT '#e0e0e0',
    user_message_bg TEXT DEFAULT '#1a73e8',
    user_message_text TEXT DEFAULT '#ffffff',
    bot_message_bg TEXT DEFAULT '#ffffff',
    bot_message_text TEXT DEFAULT '#202124',
    
    -- Dimensions & Layout
    widget_width INTEGER DEFAULT 380 CHECK (widget_width >= 280 AND widget_width <= 600),
    widget_height INTEGER DEFAULT 580 CHECK (widget_height >= 400 AND widget_height <= 800),
    widget_max_width INTEGER DEFAULT 380,
    widget_max_height INTEGER DEFAULT 580,
    position TEXT DEFAULT 'right' CHECK (position IN ('left', 'right')),
    bottom_offset INTEGER DEFAULT 24,
    side_offset INTEGER DEFAULT 24,
    toggle_button_size INTEGER DEFAULT 56,
    widget_border_radius INTEGER DEFAULT 12,
    message_border_radius INTEGER DEFAULT 10,
    button_border_radius INTEGER DEFAULT 8,
    toggle_button_border_radius INTEGER DEFAULT 50,
    
    -- Features
    font_family TEXT DEFAULT 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    font_size_base INTEGER DEFAULT 14,
    enable_animations BOOLEAN DEFAULT true,
    animation_duration_ms INTEGER DEFAULT 200,
    enable_typing_animation BOOLEAN DEFAULT true,
    typing_speed_ms INTEGER DEFAULT 15,
    enable_message_sound BOOLEAN DEFAULT false,
    message_sound_url TEXT,
    show_bot_avatar BOOLEAN DEFAULT false,
    bot_avatar_url TEXT,
    show_user_avatar BOOLEAN DEFAULT false,
    input_placeholder_text TEXT DEFAULT 'Type a message...',
    input_max_length INTEGER DEFAULT 2000,
    input_rows INTEGER DEFAULT 1,
    input_max_rows INTEGER DEFAULT 5,
    enable_file_upload BOOLEAN DEFAULT false,
    enable_emoji_picker BOOLEAN DEFAULT false,
    enable_markdown BOOLEAN DEFAULT true,
    show_timestamp BOOLEAN DEFAULT false,
    show_read_receipts BOOLEAN DEFAULT false,
    show_welcome_screen BOOLEAN DEFAULT true,
    welcome_screen_subtitle TEXT,
    
    -- Behavior
    auto_open_on_load BOOLEAN DEFAULT false,
    auto_open_delay_ms INTEGER DEFAULT 0,
    remember_conversation BOOLEAN DEFAULT true,
    conversation_timeout_hours INTEGER DEFAULT 24,
    rate_limit_messages_per_minute INTEGER DEFAULT 10,
    
    -- Advanced
    custom_css TEXT,
    custom_header_html TEXT,
    custom_footer_html TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    environment TEXT DEFAULT 'production',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Message Limits
    monthly_message_limit INTEGER DEFAULT 1000,
    messages_used_this_month INTEGER DEFAULT 0,
    limit_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
    limit_reached_message TEXT DEFAULT 'Sorry, this bot has reached its monthly message limit. Please try again next month.',
    enable_message_limit BOOLEAN DEFAULT true,
    
    -- Analytics
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    internal_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bot_id ON public.bot_configurations(bot_id);
CREATE INDEX IF NOT EXISTS idx_is_active ON public.bot_configurations(is_active);

-- 2. MESSAGES TABLE (Realtime)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    bot_id TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_bot ON public.chat_messages(bot_id);

-- 3. ENABLE REALTIME BROADCAST
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read of config (required for widget to load settings)
CREATE POLICY "Public read access for active bots"
    ON public.bot_configurations FOR SELECT
    USING (is_active = true);

-- Allow public read/write of messages (Simple logic for widget + Realtime)
CREATE POLICY "Allow public insert messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public select messages"
    ON public.chat_messages FOR SELECT
    USING (true);

-- 5. FUNCTIONS & TRIGGERS

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_configurations_updated_at
    BEFORE UPDATE ON public.bot_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Check Limits Function (RPC)
CREATE OR REPLACE FUNCTION increment_message_count(p_bot_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_config RECORD;
BEGIN
    SELECT * INTO v_config FROM public.bot_configurations WHERE bot_id = p_bot_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('allowed', false, 'reason', 'Bot not found');
    END IF;
    
    IF NOT v_config.enable_message_limit THEN
        UPDATE public.bot_configurations SET total_messages = total_messages + 1, last_used_at = NOW() WHERE bot_id = p_bot_id;
        RETURN json_build_object('allowed', true, 'unlimited', true);
    END IF;
    
    -- Monthly Reset
    IF CURRENT_DATE >= v_config.limit_reset_date THEN
        UPDATE public.bot_configurations SET messages_used_this_month = 0, limit_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') WHERE bot_id = p_bot_id;
        v_config.messages_used_this_month := 0;
    END IF;
    
    -- Limit Check
    IF v_config.messages_used_this_month >= v_config.monthly_message_limit THEN
        RETURN json_build_object('allowed', false, 'reason', 'limit_reached', 'message', v_config.limit_reached_message);
    END IF;
    
    -- Increment
    UPDATE public.bot_configurations SET messages_used_this_month = messages_used_this_month + 1, total_messages = total_messages + 1, last_used_at = NOW() WHERE bot_id = p_bot_id;
    
    RETURN json_build_object('allowed', true, 'remaining', v_config.monthly_message_limit - v_config.messages_used_this_month - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_message_count(TEXT) TO anon, authenticated;

-- 6. SAMPLE DATA
INSERT INTO public.bot_configurations (
    bot_id, name, company_name, welcome_text, webhook_url, primary_color
) VALUES (
    'demo-bot', 'Demo Support', 'Acme Inc', 'Hello! I am ready to help.', 'https://your-n8n-webhook.com', '#6366f1'
) ON CONFLICT (bot_id) DO NOTHING;
