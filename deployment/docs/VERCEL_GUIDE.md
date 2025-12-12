# 🚀 Deploying to Vercel

Vercel is the perfect place to host this widget because it's fast, free for personal use, and handles the "CORS" issues automatically with our config.

---

## Option 1: The "Lazy" Way (Vercel CLI)

If you have Node.js installed, this is the fastest method.

1.  **Open Terminal** in the `deployment/` folder.
2.  Install Vercel CLI:
    ```bash
    npm i -g vercel
    ```
3.  Run deploy:
    ```bash
    vercel
    ```
4.  Follow the prompts:
    -   Set up and deploy? **Yes**
    -   Which scope? **(Your Name)**
    -   Link to existing project? **No**
    -   Project Name? **my-chat-widget**
    -   Directory? **./** (Just press Enter)

🎉 **Done!** You will get a link like `https://my-chat-widget.vercel.app`.

---

## Option 2: The GitHub Way

1.  Create a new repository on GitHub.
2.  Push this entire project to it.
3.  Go to [Vercel.com](https://vercel.com) and log in.
4.  Click **"Add New..."** button > **Project**.
5.  Import your GitHub repository.
6.  **Important**: In "Build & Development Settings", change the **Root Directory** to `deployment`.
    -   *If you pushed just the contents of deployment, skip this.*
7.  Click **Deploy**.

---

## ⚡ After Deployment

Once you have your URL (e.g., `https://my-chat-widget.vercel.app`), update your **Integration Code**:

```html
<script src="https://my-chat-widget.vercel.app/embed.js?botId=your-bot-id"></script>
```

### ✅ Verify it Works
1.  Open your dashboard at `https://my-chat-widget.vercel.app`.
2.  Check the Admin Tool at `https://my-chat-widget.vercel.app/tools/admin-generator.html`.
