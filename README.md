# Story prep — milestone 1

Paste a job description and receive exactly three STAR story drafts. The app does not collect candidate history. Unknown details stay in brackets and all numerical values must be `xx`. There is no login, profile upload, ranking, export, fact bank or saved history.

## Run

- `npm install`
- `npx convex dev --once` to push backend functions to the existing Convex deployment.
- `npm run dev` to open the page locally.

Generation calls OpenAI directly from a Convex action using `gpt-6-luna` with `max_output_tokens: 2000`. Set `OPENAI_API_KEY` in the Convex deployment environment, never in a `VITE_` variable or frontend code. No Convex AI Gateway is used. OpenAI response storage is disabled.

A shared, atomic Convex reservation caps all AI attempts at thirty in any rolling hour, including retries and failed calls. Only call timestamps are stored. Candidate descriptions and stories are not saved. Provider failures show a plain retry message; missing setup and the hourly limit have their own messages.

## Check

- `npm test` checks complete story structure, the unchanged blank-number rule, and hourly limit boundaries.
- `npm run build` checks types and builds the page.
- `npm run test:browser` opens installed Chrome, pastes the real job description in `tests/real-jd.txt`, checks the output and captures the actual generated text in `tests/generated-stories.txt`.

The real job description is from Linear's Product Engineer posting. Its original source and retrieval date are in `tests/real-jd-source.json`. Refresh it with `node scripts/fetch-jd.mjs`.

## Publish

`npm run deploy` uses Convex static hosting. A git push does not deploy. To check a published page, run `TEST_URL=https://YOUR-DEPLOYMENT.convex.site npm run test:browser`.
