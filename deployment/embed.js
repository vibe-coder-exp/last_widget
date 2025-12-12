(function () {
    // 1. Configuration
    // Replace these with your actual Supabase values
    const CONFIG = {
        supabaseUrl: 'https://uwuizytnrmjkwscagapj.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dWl6eXRucm1qa3dzY2FnYXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg5OTksImV4cCI6MjA4MDc1NDk5OX0.siCpeFl3GGnXcrTfjmC10mjO0pNoj9L7e9zn4lCSCPY'
    };

    // Set global config for the widget to find
    window.SUPABASE_CONFIG = {
        url: CONFIG.supabaseUrl,
        anonKey: CONFIG.supabaseKey
    };

    // 2. Load Supabase SDK if not present
    function loadSupabase(callback) {
        if (window.supabase) {
            callback();
            return;
        }

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = callback;
        document.head.appendChild(script);
    }

    // 3. Load Main Widget Script
    function loadWidget() {
        // Get the botId from this script's tag
        const currentScript = document.currentScript || (function () {
            const scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();

        const botId = new URL(currentScript.src).searchParams.get('botId');

        const widgetScript = document.createElement('script');
        // Point to the location of your chat-widget.js file
        // IMPORTANT: Update this path to where your file is actually hosted
        widgetScript.src = `chat-widget.js?botId=${botId}`;
        document.body.appendChild(widgetScript);
    }

    // Initialize
    loadSupabase(loadWidget);

})();
