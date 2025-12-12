# Developer Guide

## Project Structure

```
deployment/
├── assets/              # Static assets (images, icons)
├── database/
│   └── init.sql         # Consolidated SQL setup script
├── docs/                # Documentation
├── tools/
│   └── admin-generator.html # GUI for generating SQL configs
├── chat-widget.js       # Core widget logic (Minify this for prod)
├── config.example.js    # Env template for frontend
├── index.html           # Demo page
└── fullscreen.html      # Standalone chat page
```

## Local Development

1.  **Serve the folder**:
    You need a simple HTTP server because of CORS and Module loading.
    ```bash
    npx serve deployment
    ```
2.  **Edit `chat-widget.js`**:
    The main logic is in the IIFE (Immediately Invoked Function Expression).
    -   `loadBotConfiguration`: Fetches settings.
    -   `injectStyles`: Generates dynamic CSS variables.
    -   `subscribeToMessages`: Handles Realtime logic.

## Customization

### Adding New Config Options

1.  Add column to `bot_configurations` table in Supabase.
2.  Update `transformConfig` function in `chat-widget.js` to map the new column to the config object.
3.  Use the new config value in `buildWidget` or `injectStyles`.

### Building for Production

1.  **Minify**: Run `chat-widget.js` through a minifier (Terser, UglifyJS) to reduce size.
2.  **CDN**: Host the files on a CDN (Cloudflare R2, AWS S3) for faster delivery.
3.  **Caching**:
    -   `config.js`: Long cache (immutable if using versioning).
    -   `chat-widget.js`: Short cache (or use version query params).
