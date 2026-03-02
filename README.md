# PersonaForge (Vercel Ready)

PersonaForge is a Persona-style character chat builder powered by Anthropic models.

## 1) Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 2) Environment variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# Optional
# ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

## 3) Deploy to Vercel from GitHub

1. Push this folder to a GitHub repo.
2. In Vercel, click **Add New Project** and import that repo.
3. In Vercel project settings, add:
   - `ANTHROPIC_API_KEY`
   - (optional) `ANTHROPIC_MODEL`
4. Deploy.

## Notes

- The browser no longer calls Anthropic directly.
- Requests go through server routes:
  - `/api/chat`
  - `/api/character-build`
- This keeps your API key secure for production.
