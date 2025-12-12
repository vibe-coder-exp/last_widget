-- ================================================================
-- MESSAGE LIMIT FEATURE - Migration Script
-- Add this to your existing bot_configurations table
-- ================================================================

-- Add new columns for message limits
ALTER TABLE public.bot_configurations
ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS messages_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS limit_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),
ADD COLUMN IF NOT EXISTS limit_reached_message TEXT DEFAULT 'Sorry, this bot has reached its monthly message limit. Please try again next month.',
ADD COLUMN IF NOT EXISTS enable_message_limit BOOLEAN DEFAULT true;

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

-- Grant execute permission to public users
GRANT EXECUTE ON FUNCTION increment_message_count(TEXT) TO anon, authenticated;

-- ================================================================
-- DONE! 
-- ================================================================
-- Your message limit feature is now active.
-- Default: 1000 messages per month per bot
-- 
-- To customize limits for a specific bot:
-- UPDATE bot_configurations 
-- SET monthly_message_limit = 5000 
-- WHERE bot_id = 'your-bot-id';
--
-- To disable limits for a bot:
-- UPDATE bot_configurations 
-- SET enable_message_limit = false 
-- WHERE bot_id = 'your-bot-id';
-- ================================================================
