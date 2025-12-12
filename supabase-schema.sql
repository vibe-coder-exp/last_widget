-- ================================================================
-- CHAT BOT CONFIGURATIONS - ENHANCED DATABASE SCHEMA
-- ================================================================

-- Main bot configurations table
CREATE TABLE IF NOT EXISTS public.bot_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id TEXT UNIQUE NOT NULL, -- Short unique identifier (e.g., "support-bot-001")
    
    -- ============================================
    -- BRANDING & IDENTITY
    -- ============================================
    name TEXT NOT NULL DEFAULT 'Support',
    company_name TEXT,
    logo_url TEXT, -- URL to logo image
    favicon_url TEXT, -- Optional favicon for branded experience
    
    -- ============================================
    -- MESSAGES & TEXT CONTENT
    -- ============================================
    welcome_text TEXT DEFAULT 'Welcome! How can we assist you today?',
    response_time_text TEXT DEFAULT 'Our team typically responds within minutes',
    placeholder_text TEXT DEFAULT 'Type a message...',
    start_button_text TEXT DEFAULT 'Start conversation',
    
    -- Error Messages
    error_message_connection TEXT DEFAULT 'Unable to connect. Please try again later.',
    error_message_send TEXT DEFAULT 'Unable to send message. Please try again.',
    error_message_config TEXT DEFAULT 'Configuration error. Please contact support.',
    
    -- Success Messages
    message_sent_indicator TEXT DEFAULT 'Sent',
    message_delivered_indicator TEXT DEFAULT 'Delivered',
    
    -- ============================================
    -- HEADER CUSTOMIZATION
    -- ============================================
    header_show_logo BOOLEAN DEFAULT true,
    header_show_name BOOLEAN DEFAULT true,
    header_show_status BOOLEAN DEFAULT false, -- Show "Online" status
    header_status_text TEXT DEFAULT 'Online',
    header_background_color TEXT,
    header_text_color TEXT,
    
    -- ============================================
    -- FOOTER CUSTOMIZATION
    -- ============================================
    footer_show BOOLEAN DEFAULT true,
    footer_text TEXT DEFAULT 'Powered by n8n',
    footer_link TEXT DEFAULT 'https://n8n.io',
    footer_link_new_tab BOOLEAN DEFAULT true,
    footer_background_color TEXT,
    footer_text_color TEXT,
    
    -- ============================================
    -- WEBHOOK CONFIGURATION
    -- ============================================
    webhook_url TEXT NOT NULL,
    webhook_route TEXT DEFAULT 'general',
    webhook_retry_attempts INTEGER DEFAULT 3,
    webhook_timeout_ms INTEGER DEFAULT 30000,
    
    -- ============================================
    -- COLOR SCHEME (Professional)
    -- ============================================
    primary_color TEXT DEFAULT '#1a73e8',     -- Main brand color
    secondary_color TEXT DEFAULT '#0d47a1',   -- Darker shade for hover states
    accent_color TEXT DEFAULT '#34a853',     -- Success/positive actions
    surface_color TEXT DEFAULT '#f8f9fa',    -- Light background surfaces
    background_color TEXT DEFAULT '#ffffff',  -- Main background
    font_color TEXT DEFAULT '#202124',       -- Primary text color
    border_color TEXT DEFAULT '#e0e0e0',     -- Border color
    
    -- Message Bubble Colors
    user_message_bg TEXT DEFAULT '#1a73e8',
    user_message_text TEXT DEFAULT '#ffffff',
    bot_message_bg TEXT DEFAULT '#ffffff',
    bot_message_text TEXT DEFAULT '#202124',
    
    -- ============================================
    -- DIMENSIONS & LAYOUT
    -- ============================================
    widget_width INTEGER DEFAULT 380 CHECK (widget_width >= 280 AND widget_width <= 600),
    widget_height INTEGER DEFAULT 580 CHECK (widget_height >= 400 AND widget_height <= 800),
    widget_max_width INTEGER DEFAULT 380,
    widget_max_height INTEGER DEFAULT 580,
    
    -- Position
    position TEXT DEFAULT 'right' CHECK (position IN ('left', 'right')),
    bottom_offset INTEGER DEFAULT 24, -- Distance from bottom in pixels
    side_offset INTEGER DEFAULT 24,   -- Distance from left/right in pixels
    
    -- Button Size
    toggle_button_size INTEGER DEFAULT 56 CHECK (toggle_button_size >= 40 AND toggle_button_size <= 72),
    
    -- ============================================
    -- UI ENHANCEMENTS
    -- ============================================
    
    -- Typography
    font_family TEXT DEFAULT 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    font_size_base INTEGER DEFAULT 14,
    
    -- Border Radius
    widget_border_radius INTEGER DEFAULT 12,
    message_border_radius INTEGER DEFAULT 10,
    button_border_radius INTEGER DEFAULT 8,
    toggle_button_border_radius INTEGER DEFAULT 50, -- Percentage
    
    -- Animations
    enable_animations BOOLEAN DEFAULT true,
    animation_duration_ms INTEGER DEFAULT 200,
    enable_typing_animation BOOLEAN DEFAULT true,
    typing_speed_ms INTEGER DEFAULT 15,
    
    -- Sounds
    enable_message_sound BOOLEAN DEFAULT false,
    message_sound_url TEXT,
    
    -- Avatars
    show_bot_avatar BOOLEAN DEFAULT false,
    bot_avatar_url TEXT,
    show_user_avatar BOOLEAN DEFAULT false,
    
    -- Input Field
    input_placeholder_text TEXT DEFAULT 'Type a message...',
    input_max_length INTEGER DEFAULT 2000,
    input_rows INTEGER DEFAULT 1,
    input_max_rows INTEGER DEFAULT 5,
    
    -- Features
    enable_file_upload BOOLEAN DEFAULT false,
    enable_emoji_picker BOOLEAN DEFAULT false,
    enable_markdown BOOLEAN DEFAULT true,
    show_timestamp BOOLEAN DEFAULT false,
    show_read_receipts BOOLEAN DEFAULT false,
    
    -- Welcome Screen
    show_welcome_screen BOOLEAN DEFAULT true,
    welcome_screen_subtitle TEXT,
    
    -- ============================================
    -- BEHAVIOR SETTINGS
    -- ============================================
    auto_open_on_load BOOLEAN DEFAULT false,
    auto_open_delay_ms INTEGER DEFAULT 0,
    remember_conversation BOOLEAN DEFAULT true,
    conversation_timeout_hours INTEGER DEFAULT 24,
    
    -- Rate Limiting
    rate_limit_messages_per_minute INTEGER DEFAULT 10,
    
    -- ============================================
    -- ADVANCED CUSTOMIZATION
    -- ============================================
    custom_css TEXT, -- Custom CSS overrides
    custom_header_html TEXT, -- Custom header content
    custom_footer_html TEXT, -- Custom footer content
    
    -- ============================================
    -- METADATA & STATUS
    -- ============================================
    is_active BOOLEAN DEFAULT true,
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Message Limits & Usage Tracking
    monthly_message_limit INTEGER DEFAULT 1000,
    messages_used_this_month INTEGER DEFAULT 0,
    limit_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
    limit_reached_message TEXT DEFAULT 'Sorry, this bot has reached its monthly message limit. Please try again next month.',
    enable_message_limit BOOLEAN DEFAULT true,
    
    -- Analytics
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    
    -- Notes
    internal_notes TEXT -- For admin reference
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_bot_id ON public.bot_configurations(bot_id);
CREATE INDEX IF NOT EXISTS idx_is_active ON public.bot_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_environment ON public.bot_configurations(environment);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;

-- Public read access for active bots
CREATE POLICY "Public read access for active bots"
    ON public.bot_configurations
    FOR SELECT
    USING (is_active = true);

-- ================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ================================================================
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

-- ================================================================
-- FUNCTION: Check and increment message count
-- ================================================================
CREATE OR REPLACE FUNCTION increment_message_count(p_bot_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_config RECORD;
    v_result JSON;
BEGIN
    -- Get current bot configuration
    SELECT * INTO v_config
    FROM public.bot_configurations
    WHERE bot_id = p_bot_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('allowed', false, 'reason', 'Bot not found');
    END IF;
    
    -- Check if limit feature is enabled
    IF NOT v_config.enable_message_limit THEN
        -- Update total messages analytics
        UPDATE public.bot_configurations
        SET total_messages = total_messages + 1,
            last_used_at = NOW()
        WHERE bot_id = p_bot_id;
        
        RETURN json_build_object('allowed', true, 'unlimited', true);
    END IF;
    
    -- Reset counter if we're in a new month
    IF CURRENT_DATE >= v_config.limit_reset_date THEN
        UPDATE public.bot_configurations
        SET messages_used_this_month = 0,
            limit_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
        WHERE bot_id = p_bot_id;
        
        v_config.messages_used_this_month := 0;
    END IF;
    
    -- Check if limit reached
    IF v_config.messages_used_this_month >= v_config.monthly_message_limit THEN
        RETURN json_build_object(
            'allowed', false,
            'reason', 'limit_reached',
            'message', v_config.limit_reached_message,
            'used', v_config.messages_used_this_month,
            'limit', v_config.monthly_message_limit,
            'reset_date', v_config.limit_reset_date
        );
    END IF;
    
    -- Increment counters
    UPDATE public.bot_configurations
    SET messages_used_this_month = messages_used_this_month + 1,
        total_messages = total_messages + 1,
        last_used_at = NOW()
    WHERE bot_id = p_bot_id;
    
    RETURN json_build_object(
        'allowed', true,
        'used', v_config.messages_used_this_month + 1,
        'limit', v_config.monthly_message_limit,
        'remaining', v_config.monthly_message_limit - v_config.messages_used_this_month - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_message_count(TEXT) TO anon, authenticated;


-- ================================================================
-- SAMPLE DATA - Professional Support Bot
-- ================================================================
INSERT INTO public.bot_configurations (
    bot_id,
    name,
    company_name,
    welcome_text,
    response_time_text,
    webhook_url,
    primary_color,
    secondary_color,
    widget_width,
    widget_height
) VALUES (
    'demo-support-bot',
    'Support',
    'Your Company',
    'Welcome to our support chat! How can we help you today?',
    'Our team typically responds within 2-3 minutes',
    'https://your-n8n-webhook-url.com/webhook/chat',
    '#1a73e8',
    '#0d47a1',
    380,
    580
) ON CONFLICT (bot_id) DO NOTHING;

-- ================================================================
-- SAMPLE DATA - Sales Bot with Custom Colors
-- ================================================================
INSERT INTO public.bot_configurations (
    bot_id,
    name,
    company_name,
    welcome_text,
    webhook_url,
    primary_color,
    secondary_color,
    user_message_bg,
    position
) VALUES (
    'sales-assistant',
    'Sales Team',
    'Your Company',
    'Hi! Looking to learn more about our products?',
    'https://your-n8n-webhook-url.com/webhook/sales',
    '#34a853',
    '#1e8e3e',
    '#34a853',
    'left'
) ON CONFLICT (bot_id) DO NOTHING;
