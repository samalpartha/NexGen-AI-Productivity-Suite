# 🚀 Quick Start - Hugging Face Version

## ✨ What's New?

**Now powered by Hugging Face** - completely free AI with no API costs!

---

## 🎯 For End Users

Just visit the deployed URL and start using the app. No setup required!

**Example**: `https://your-app.vercel.app`

---

## 👨‍💻 For App Owner/Developer

### Get Hugging Face Token

1. Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Name it (e.g., "NexGen AI Suite")
4. Select "Read" access
5. Copy the token

### Local Development

**Option 1: Frontend Only (UI Development)**
```bash
npm run dev
```
- Frontend runs on http://localhost:3000
- API calls will fail (backend not running)
- Good for UI/UX work

**Option 2: Full Stack (With Backend)**
```bash
# Add token to .env.local
HF_API_KEY=hf_your_token_here

# Install Vercel CLI (one-time)
npm install -g vercel

# Run with backend functions
vercel dev
```
- Full stack running locally
- Test all API integrations

---

### Deployment to Vercel

**Step 1: Get Token**
- Get your Hugging Face token (see above)

**Step 2: Push to GitHub**
```bash
git add .
git commit -m "Migrate to Hugging Face"
git push origin main
```

**Step 3: Deploy**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repo
4. Add environment variable:
   - Name: `HF_API_KEY`
   - Value: Your Hugging Face token
5. Deploy!

**Step 4: Share**
- Get your Vercel URL
- Share with users - they can use immediately!
- **Completely free** - no API costs!

---

## 🤖 AI Models Used

| Tool | Model |
|------|-------|
| Resume Scanner | Qwen 2.5 72B |
| Content Humanizer | Llama 3.1 70B |
| SEO Optimizer | Mixtral 8x7B |
| Background Remover | RMBG-1.4 |
| LaTeX Converter | Qwen 2.5 72B |

---

## 💰 Cost

**Completely FREE!**
- ✅ No API costs
- ✅ No usage limits (rate-limited but no caps)
- ✅ No credit card required
- ✅ Sustainable forever

---

## 🆘 Troubleshooting

**"Network Error" locally**:
- Use `vercel dev` instead of `npm run dev`

**"Model is loading" error**:
- First request may take 10-30 seconds (cold start)
- Subsequent requests are fast

**Rate limit errors**:
- Wait a few seconds and retry
- Hugging Face has rate limits but no hard caps

---

## 🎉 You're Done!

Your app now:
- ✅ Uses Hugging Face (free!)
- ✅ No API costs ever
- ✅ Ready to deploy
- ✅ Great AI models

**Next**: Deploy to Vercel and share! 🚀
