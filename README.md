# Story prep — milestone 1

Paste a job description and receive exactly three STAR story drafts. The app does not collect candidate history. Unknown details stay in brackets and all numerical values must be `xx`. There is no login, profile upload, ranking, export, fact bank or saved history.

## Run

- `npm install`
- `npx convex dev --once` to push backend functions to the existing Convex deployment.
- `npm run dev` to open the page locally.

Generation currently uses Convex AI Gateway through the Convex agent component. Convex AI must be enabled for the team. No provider key is sent to the browser. Messages are not saved and threads are not created.

## Check

- `npm test` checks complete story structure and the blank-number rule.
- `npm run build` checks types and builds the page.
- `npm run test:browser` opens installed Chrome, pastes the real job description in `tests/real-jd.txt`, checks the output and captures the actual generated text in `tests/generated-stories.txt`.

The real job description is from Linear's Product Engineer posting. Its original source and retrieval date are in `tests/real-jd-source.json`. Refresh it with `node scripts/fetch-jd.mjs`.

## Publish

`npm run deploy` uses Convex static hosting. A git push does not deploy. To check a published page, run `TEST_URL=https://YOUR-DEPLOYMENT.convex.site npm run test:browser`.
