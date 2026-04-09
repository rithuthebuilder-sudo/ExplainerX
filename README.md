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
    *   Add the following Firebase variables (you can find these in your Firebase Project Settings):
        *   `VITE_FIREBASE_API_KEY`
        *   `VITE_FIREBASE_AUTH_DOMAIN`
        *   `VITE_FIREBASE_PROJECT_ID`
        *   `VITE_FIREBASE_STORAGE_BUCKET`
        *   `VITE_FIREBASE_MESSAGING_SENDER_ID`
        *   `VITE_FIREBASE_APP_ID`
        *   `VITE_FIREBASE_MEASUREMENT_ID`
        *   `VITE_FIREBASE_DATABASE_ID` (Optional, defaults to `(default)`)
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
