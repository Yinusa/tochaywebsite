<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Work rules

1. **Verify All Tasks**: You must confirm that every single task requested has been completely finished.
2. **Build Safety**: Always run `npm run build` after changes to verify zero warnings or errors.
3. **Read Documentation**: Always read docs files (`docs/ARCHITECTURE.md`, etc.) before carrying out any architectural or style tasks.
4. **Branding Typography**: Always use the **Gilroy** font family (`font-sans`) for all core layout typography (titles, headlines, body, taglines, subtext, and description paragraphs). The serif font family (Ogg / `font-serif` / `font-editorial`) must NOT be used for headers, text labels, or descriptions.
5. **No Automatic Git Push**: Never run `git push` or publish git commits automatically. All git push operations are strictly left to the user to execute manually.

