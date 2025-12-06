<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NexGen AI Productivity Suite

A powerful multi-agent AI workspace featuring 5 specialized tools powered by **Hugging Face** open-source AI models - completely free!

## 🚀 Features

- **📄 Resume Scanner** - ATS-optimized resume analysis with match scoring
- **✍️ Plagiarism Remover** - Advanced content humanization with multiple modes
- **📊 SEO Optimizer** - Comprehensive SEO analysis with Google Search grounding
- **🖼️ Background Remover** - AI-powered image background removal
- **📝 LaTeX Converter** - Bidirectional LaTeX ↔ Word document conversion

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Hugging Face Token** - [Get your free token](https://huggingface.co/settings/tokens) (optional for deployment)

## 🛠️ Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd NexGen-AI-Productivity-Suite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (For Deployment Only)

> [!NOTE]
> **No API Key Required for Users!** The application uses a backend proxy server with **Hugging Face** (completely free). Users don't need any API key.

**For App Owner/Deployer Only:**

When deploying, you'll need to set your Hugging Face token as an environment variable. See [Deployment](#-deployment) section below.

For local development with backend functions:
```bash
# .env.local (optional for local testing with Vercel Dev)
HF_API_KEY=your_huggingface_token_here
```

### 4. Start Development Server

**Option A: Frontend Only (Recommended for UI development)**
```bash
npm run dev
```
The app will open at **http://localhost:3000**

> [!WARNING]
> With `npm run dev`, the frontend will run but API calls will fail since the backend functions aren't running. This is fine for UI development.

**Option B: Full Stack with Vercel Dev (For testing API integration)**
```bash
# Install Vercel CLI globally (one-time setup)
npm install -g vercel

# Run with backend functions
vercel dev
```
This starts both frontend and serverless functions locally.

### 5. Build for Production (Optional)

```bash
npm run build
npm run preview
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

## 🌐 Deployment

> [!IMPORTANT]
> **Backend Proxy Architecture**: This app uses serverless functions to proxy Hugging Face API requests. Only you (the app owner) need to provide a token during deployment. End users won't need any token - **completely free for everyone!**

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add backend proxy for Gemini API"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the Vite configuration

3. **Add Environment Variable** (App Owner Only):
   - In project settings, go to "Environment Variables"
   - Add: `HF_API_KEY` = `your_huggingface_token`
   - Get token from: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Click "Deploy"

4. **Access Your App**:
   - Vercel will provide a URL like: `https://your-app.vercel.app`
   - Share this URL with users - they can use the app without any API key!

### Deploy to Netlify (Alternative)

> [!WARNING]
> Netlify deployment requires Netlify Functions. The current setup is optimized for Vercel. For Netlify, you'll need to adapt the `api/` folder to `netlify/functions/` format.

**Recommended**: Use Vercel for easiest deployment with serverless functions.

## 🔧 Troubleshooting

### "Network Error" or "Failed to fetch"

- **Cause**: Backend API endpoints not accessible
- **Solution (Local)**: Use `vercel dev` instead of `npm run dev` to run serverless functions locally
- **Solution (Deployed)**: Verify deployment succeeded and check Vercel function logs

### "No response from AI" Error (Deployed App)

- **Cause**: Missing or invalid API key on server
- **Solution**: Check environment variables in Vercel dashboard (Project Settings → Environment Variables)

### Port 3000 Already in Use

- **Solution**: Kill the process or change port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // Change to any available port
  }
  ```

### API Rate Limits

- **Cause**: Exceeded Gemini API free tier limits
- **Solution**: Monitor usage in [Google AI Studio](https://aistudio.google.com/) and upgrade if needed
- **Note**: Since all users share one API key, consider implementing additional rate limiting

## 🏗️ Project Structure

```
NexGen-AI-Productivity-Suite/
├── api/                  # Vercel serverless functions (backend)
│   ├── analyze-resume.ts
│   ├── humanize-content.ts
│   ├── analyze-seo.ts
│   ├── remove-background.ts
│   ├── convert-document.ts
│   └── tsconfig.json
├── components/           # React components for each tool
│   ├── ResumeOptimizer.tsx
│   ├── ContentHumanizer.tsx
│   ├── SeoOptimizer.tsx
│   ├── BackgroundRemover.tsx
│   └── LatexConverter.tsx
├── services/
│   ├── apiService.ts     # Frontend API calls to backend
│   └── geminiService.ts  # Legacy (kept for reference)
├── App.tsx               # Main app component
├── types.ts              # TypeScript type definitions
├── vite.config.ts        # Vite configuration
├── vercel.json           # Vercel deployment config
└── .env.local            # Environment variables (owner only)
```

## 🔐 Security Notes

- **API Token Security**: The Hugging Face token is stored securely on the server (Vercel environment variables)
- **Never exposed to client**: Users never see or need the token
- **Environment variables**: Set `HF_API_KEY` only in deployment platform settings
- **Completely free**: No API costs or limits (rate-limited but free)
- **Monitor usage**: Check usage at [huggingface.co](https://huggingface.co/)

## 🏛️ Architecture

**Frontend**: React 19 + Vite 6 (Static Site)  
**Backend**: Vercel Serverless Functions (Node.js 20)  
**API**: Hugging Face Inference API (completely free!)  
**Deployment**: Vercel (free tier compatible)

**AI Models Used**:
- **Resume Analysis**: Qwen/Qwen2.5-72B-Instruct
- **Content Humanizer**: meta-llama/Llama-3.1-70B-Instruct
- **SEO Optimizer**: mistralai/Mixtral-8x7B-Instruct-v0.1
- **Background Remover**: briaai/RMBG-1.4
- **LaTeX Converter**: Qwen/Qwen2.5-72B-Instruct

**Request Flow**:
1. User interacts with frontend
2. Frontend calls `/api/*` endpoints
3. Serverless function processes request
4. Function calls Hugging Face API with server-side token
5. Response returned to frontend
6. Frontend displays results to user

## 📄 License

This project was created with Google AI Studio.

## 🤝 Support

For issues or questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review [Gemini API Documentation](https://ai.google.dev/docs)
- Open an issue in this repository
