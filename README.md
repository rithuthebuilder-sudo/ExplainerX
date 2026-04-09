# ExplainerX

An AI-powered learning explainer tool built with React, Vite, and Gemini AI.

## Deployment on Vercel

This project is configured for easy deployment on Vercel.

### Steps to Deploy

1.  **Push to GitHub/GitLab/Bitbucket:** Ensure your code is in a repository.
2.  **Import to Vercel:** Go to [Vercel](https://vercel.com) and import your repository.
3.  **Configure Environment Variables:**
    *   In the Vercel project settings, go to **Environment Variables**.
    *   Add `GEMINI_API_KEY` with your Google AI Studio API key.
4.  **Deploy:** Vercel will automatically detect the Vite framework and deploy your app.

### Configuration Details

*   **Framework Preset:** Vite
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **SPA Routing:** Handled by `vercel.json` to ensure all routes serve `index.html`.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Set up your `.env` file with `GEMINI_API_KEY`.
3.  Start the development server:
    ```bash
    npm run dev
    ```
