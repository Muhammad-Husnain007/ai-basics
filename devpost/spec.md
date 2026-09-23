---
doc: spec
status: approved
---

# DevLens — Technical Spec

## How This Works, In Plain Language
DevLens is a small local Node program. An Express route waits for a crash webhook. A regex reads the stack trace and pulls out a file path and a line number. The program runs `npx jest` in the target repo and expects that run to fail. It writes a labeled stub of the sample discount fix onto the local file and runs `npx jest` again. Live GPT-4o is not called. Only a passing second run is allowed to continue. `@octokit/rest` then creates a branch, commits that patched file, and opens a GitHub pull request. The terminal prints the exact `[DevLens Agent]` lines from the PRD. If parsing, the first test run, the second test run, or the GitHub call fails, the process logs the matching error and stops with no pull request.

This stays one process on one machine, talking to the GitHub API. A queue, a dashboard, and a live model client are not part of the proof.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. The sample Express app crashes and sends JSON to `POST /webhook/crash`.
2. The webhook route logs `[DevLens Agent] Crash Received.`
3. The stack parser runs the regex. If it cannot produce a file path and line number, the route logs `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` and returns. No tests, no model call, no pull request. PRD ref: `prd.md > Receive a crash webhook`, `prd.md > Abort without a pull request`.
4. Otherwise the route logs the error message, the stack, and the parsed file and line.
5. The test runner logs `[DevLens Agent] Running local unit tests (Jest) to replicate bug....` and runs `npx jest` in the target repo. A zero exit means the crash was not replicated: log `[DevLens Agent] Error: Unable to replicate crash with existing test suite.` and stop. PRD ref: `prd.md > Replicate the crash with unit tests`.
6. A non-zero exit logs `[DevLens Agent] Formulating AI fix patch & re-running tests....` The patch generator reads the target file and, for this proof, applies the labeled discount stub. The program writes that file locally.
7. The test runner runs `npx jest` again. A non-zero exit restores the original file, logs `[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.`, and stops.
8. A zero exit means the fix is verified locally. The GitHub publisher creates a branch, commits the patched file, and opens a pull request. If that call fails, restore nothing further on GitHub, log `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.`, and stop. The local verified file can remain, because the tests already passed.
9. On success the route logs `[DevLens Agent] Fix verified! Pull Request opened: <PR_URL>.` The pull request body contains the issue description, the root cause, and the passing Jest result. PRD ref: `prd.md > Verify the fix and open a pull request`.

## Stack
- Node.js and npm. The version on the machine is unverified; confirm it at the start of the build.
- Express, for `POST /webhook/crash`. https://expressjs.com/
- No OpenAI SDK in this proof. The patch step is a labeled stub of the sample discount fix. See **Decisions and Open Issues**.
- `node:child_process` `execSync` to run `npx jest`. https://nodejs.org/api/child_process.html
- Jest, inside the target repo. https://jestjs.io/
- `@octokit/rest` for the branch, the commit, and the pull request. https://octokit.github.io/rest.js/
- `GITHUB_TOKEN` for GitHub. It comes from the environment. Never commit it.

Package versions are whatever npm installs at build time. Confirm the Octokit contents and git APIs against current docs before the first live call.

## Where It Runs and How Someone Tries It
Local Node process. No hosting. The demo video is a screen recording of the terminal and the GitHub pull request. The public GitHub repository is the submission repo. Deployment is not part of this proof.

Environment: Node.js, npm, an `OPENAI_API_KEY`, and a `GITHUB_TOKEN` that can create a branch and open a pull request on the single target repository.

Start and record:

1. Copy `.env.example` to `.env` and fill the two keys locally.
2. Install dependencies in this project and in `sample-target/`.
3. Start DevLens with `node src/server.js`. It listens for `POST /webhook/crash`.
4. Trigger the sample target so it posts a crash payload at that route.
5. Read the terminal for the PRD log lines.
6. Open the printed pull request URL.

## Look and Feel
Terminal only. Each status line is prefixed `[DevLens Agent]`. Errors are that prefix plus `Error:` and the exact sentences in the PRD. The success line includes the pull request URL. No colors, layout, or extra copy were specified. PRD ref: `prd.md > Look and Feel`. Scope ref: `scope.md > Inspiration & Identity`.

## Components

### Webhook server
Express app. `POST /webhook/crash` accepts JSON: error name, message, stack trace, and target repo path. It prints the crash header and runs the other components in order. It does not open a pull request itself.
PRD ref: `prd.md > Receive a crash webhook`.

### Stack parser
A regex over the stack string. It returns `filePath` and `lineNumber`, or nothing. Node stack lines are the format it must accept (`path:line:column`). A parsed path is resolved against the target repo path from the payload. No source-map library.
PRD ref: `prd.md > Receive a crash webhook`.

### Test runner
`npx jest` runs in the target repo. The first call must exit non-zero to continue. The second call must exit zero to continue. Stdout and stderr from that run are what the pull request calls the passing test results.
PRD ref: `prd.md > Replicate the crash with unit tests`, `prd.md > Verify the fix and open a pull request`.

### Patch generator
Reads the file at the parsed path. This proof does not call GPT-4o. A labeled stub recognizes the sample discount bug (`price + price * rate`) and writes the same file with that sum changed to a difference. Any other file is treated as an unusable patch and is not written. If a later Jest run fails, the original text is written back.
PRD ref: `prd.md > Verify the fix and open a pull request`, `prd.md > Abort without a pull request`.

### GitHub publisher
Uses `@octokit/rest` and `GITHUB_TOKEN`. After local Jest passes: create a new branch from the default branch, commit the patched file onto that branch, open one pull request. The body has the issue description, the root cause, and the passing Jest output. The returned HTML URL is the `<PR_URL>` in the success log.
PRD ref: `prd.md > Verify the fix and open a pull request`.

### Sample target
One small Express app with one real bug and a Jest test that fails because of that bug. Its crash handler posts the webhook payload. It is the single target repository for the demo. The payload still carries the target path, so the agent is not limited to a hardcoded folder name. This sample is real code and a real test, not a stubbed pass.
PRD ref: `prd.md > The Core Journey`.

## Data Model
No database. Each webhook is handled once and forgotten when the process finishes that request.

The payload shape:

- `errorName` — string
- `message` — string
- `stack` — string
- `targetRepoPath` — absolute or project-relative path to the single target repo

The parser adds `filePath` and `lineNumber` in memory. The patched file lives on disk in the target repo, and on the new GitHub branch after a successful publish. Nothing else is stored between requests.

## File Structure

```
devlens-ai-agent/
├── package.json              # express, @octokit/rest
├── .env.example              # OPENAI_API_KEY, GITHUB_TOKEN names only
├── src/
│   ├── server.js             # Express and POST /webhook/crash
│   ├── parseStack.js         # regex → filePath, lineNumber
│   ├── runTests.js           # execSync npx jest
│   ├── generatePatch.js      # labeled stub of the discount fix, plus restore
│   └── openPullRequest.js    # Octokit branch, commit, pull request
├── sample-target/            # the one demo repository
│   ├── package.json          # express, jest
│   ├── src/app.js            # crashing handler that posts the webhook
│   └── src/app.test.js       # Jest test that fails until the fix
└── devpost/                  # planning docs
```

## External Services and Dependencies
- Patch generation is simulated for the sample discount bug. OpenAI was not used after the API returned `credit_balance_exhausted`. Docs for the model that was planned: https://platform.openai.com/docs/models/gpt-4o
- GitHub REST, via `@octokit/rest`: get the default branch ref, create a ref for the new branch, commit the file on that branch, create the pull request. Key: `GITHUB_TOKEN`. Docs: https://docs.github.com/en/rest and https://octokit.github.io/rest.js/
- The target repo must already exist on GitHub and match the local `targetRepoPath`, so the branch can be pushed through the API. Owner and repo come from that local git remote, or from env values `GITHUB_OWNER` and `GITHUB_REPO` if the remote cannot be read. Confirm which one works on the first build step.

## Important Failure Modes
- **Stack regex does not match** → `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` Stop. No pull request.
- **First `npx jest` exits zero** → `[DevLens Agent] Error: Unable to replicate crash with existing test suite.` Stop. No pull request.
- **Second `npx jest` exits non-zero, or the model returns unusable file text** → restore the original file, log `[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.` Stop. No pull request.
- **Octokit cannot open the pull request** → `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.` Stop. No pull request.

## What Was Simplified and Why
- **A labeled stub of the discount fix** instead of a live GPT-4o call — the learner chose this after OpenAI returned `credit_balance_exhausted` and they declined to add credits. The Jest gate and the GitHub pull request stay real. A live model call would need a funded API key.
- **`execSync` inside the webhook request** instead of a job queue — the terminal can print each line in order while the demo is recorded. A queue would hide that timing.
- **A regex** instead of a source-map stack parser — the learner chose regex. It only has to read a Node stack from the sample target.
- **A `sample-target/` app in this project** instead of a separate production service — the payload still carries `targetRepoPath`. One folder is enough to record the video.
- **No deploy, dashboard, auth, or multi-repo support** — already cut in `scope.md > Explicitly Cut`.

## Decisions and Open Issues
- Learner choice: Express `POST /webhook/crash` with JSON containing the error name, message, stack trace, and target repo path. Tradeoff: the sender must be able to reach this local route during the demo.
- Learner choice: regex parser for `filePath` and `lineNumber`. Tradeoff: stack formats that do not match the regex abort. The exact pattern is checked against a real Node stack in the build.
- Learner choice: `child_process.execSync` running `npx jest` before the patch (must fail) and after (must pass). Tradeoff: the full suite runs twice, and the webhook waits until Jest finishes.
- Learner choice: `@octokit/rest` plus `GITHUB_TOKEN` to create the branch, commit the patch, and open the pull request. Tradeoff: the token and the GitHub repo must allow that, and a local `git` CLI is not the publisher.
- Learner choice, revised during the build: do not call GPT-4o. Return the known discount fix from a stub in `src/generatePatch.js`. Tradeoff: the proof no longer shows a model writing the patch. Jest still decides whether that patch is kept.
- Derived from those choices: restore the original file when the second Jest run fails; put the passing Jest output in the pull request body; keep a `sample-target/` app so the demo has a real crash.
- No learner uncertainty was identified beyond the three model names in one sentence. Nothing else from `prd.md > Open Questions`; that section is empty.
- Resolved during the build: this proof does not call GPT-4o. The sample patch is simulated and labeled.
