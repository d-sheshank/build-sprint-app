# Story prep — milestones 1 and 2

Paste a job description and receive exactly three STAR story drafts with `xx` blanks, just as in milestone 1. After those drafts appear, paste your profile, past projects, or achievements into the notes box and regenerate using the same JD plus your notes. Unknown details stay in brackets and missing numerical facts stay `xx`. There is no login, file upload, ranking, export, fact bank, or saved history.

Each numerical occurrence in the updated stories has a clickable label. **From your notes** quotes the exact original input line; **calculated** shows the arithmetic and the exact source lines. The model references a server-built catalog rather than writing numerical values. The server resolves references, rejects unsupported numbers, and performs sums or differences using exact decimal arithmetic. Calculations require distinct catalog inputs with matching currency and scale suffixes. The original JD-only validator is unchanged. Notes and their source quotes are held on the page, not persisted.

## Run

- `npm install`
- `npx convex dev --once` to push backend functions to the existing Convex deployment.
- `npm run dev` to open the page locally.

Generation calls OpenAI directly from a Convex action using `gpt-6-luna` with `max_output_tokens: 2000`. Set `OPENAI_API_KEY` in the Convex deployment environment, never in a `VITE_` variable or frontend code. No Convex AI Gateway is used. OpenAI response storage is disabled.

A shared, atomic Convex reservation caps all AI attempts at thirty in any rolling hour, including retries and failed calls. Only call timestamps are stored. Job descriptions, notes, and stories are not saved. Provider failures show a plain retry message; missing setup and the hourly limit have their own messages.

## Check

- `npm test` checks complete story structure, the unchanged blank-number rule, hourly limit boundaries, exact source quotes, valid arithmetic, and rejection of unsupported numbers.
- `npm run build` checks types and builds the page.
- `npm run test:browser` opens installed Chrome, pastes the real job description in `tests/real-jd.txt`, checks the output and captures the JD-only output in `tests/generated-stories.txt`. It then uses the requested Acme notes, checks every number and source popup on desktop and mobile, and captures the unedited notes-based output in `tests/generated-notes-stories.txt` with its evidence in the matching JSON file.

The real job description is from Linear's Product Engineer posting. Its original source and retrieval date are in `tests/real-jd-source.json`. Refresh it with `node scripts/fetch-jd.mjs`.

## Publish

`npm run deploy` uses Convex static hosting. A git push does not deploy. To check a published page, run `TEST_URL=https://YOUR-DEPLOYMENT.convex.site npm run test:browser`.
