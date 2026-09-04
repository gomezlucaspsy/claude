# RobotForge Chat (Next.js)

This project is your archived `robotforge-chat.jsx` migrated to a Next.js app so it can be deployed on Vercel from GitHub.

## 1) Install and run locally

```bash
npm install
```

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## 2) Deploy with GitHub + Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, import that GitHub repo.
3. Add environment variables in Vercel Project Settings:
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL` (optional, defaults to `claude-sonnet-4-20250514`)
4. Deploy.

## Notes

- The client now calls `POST /api/chat`.
- Anthropic API key is server-side only (safe for Vercel hosting).