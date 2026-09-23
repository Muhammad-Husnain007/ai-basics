---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A crash webhook logs the file and line, or aborts when the stack cannot be parsed**
  Becomes usable: A local server accepts `POST /webhook/crash` and prints `[DevLens Agent] Crash Received.` plus the parsed file and line, or the parse-abort line. The sample target can produce a real Node stack.
  Why now: Bootstrapping lives here, inside the first behavior you can try. The regex is the risk that needs a real Node stack before any paid API is called.
  PRD ref: `prd.md > Receive a crash webhook`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Webhook server`, `spec.md > Stack parser`, `spec.md > Sample target`, `spec.md > File Structure`
  Build: Scaffold `package.json`, `.env.example`, and `src/server.js`. Add the regex parser. Add `sample-target/` with one real bug, a Jest test that fails because of it, and a crash path that posts `errorName`, `message`, `stack`, and `targetRepoPath`.
  Verify (mechanical): Start `node src/server.js`. POST a payload whose stack is a real Node stack from the sample target and confirm the log contains `[DevLens Agent] Crash Received.` plus that file and line. POST a payload with no file or line and confirm the log is `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` and that no patch file is written.
  Learner check: Start the server, send one real sample crash and one stack with no file or line, and confirm the two terminal lines match what you specified.
  Commit: `Log parsed crash file and line from webhook`

- [x] **2. Jest must fail, then the labeled discount stub must make the suite pass, or the original file comes back**
  Becomes usable: A parsed crash runs `npx jest`. A passing suite aborts with the unable-to-replicate line. A failing suite applies the labeled discount stub, re-runs Jest, and either leaves the fixed file in place or restores the original and logs the failed-fix line.
  Why now: This is the verification half of the kernel. The live model call could not be funded, so the learner replaced it with a labeled stub that still has to pass Jest before GitHub is involved.
  PRD ref: `prd.md > Replicate the crash with unit tests`, `prd.md > Verify the fix and open a pull request`, `prd.md > Abort without a pull request`
  Spec ref: `spec.md > Test runner`, `spec.md > Patch generator`, `spec.md > Important Failure Modes`
  Build: Add `src/runTests.js` and `src/generatePatch.js`. Wire them after a successful parse. The patch generator is a labeled stub of the discount fix, not a live model call. On a second Jest failure, write the original file back.
  Verify (mechanical): Confirm `npx jest` in `sample-target/` exits non-zero before the run. POST the sample crash and confirm the formulating line, a second Jest exit of zero, and a changed target file. POST a target whose Jest suite already passes and confirm `[DevLens Agent] Error: Unable to replicate crash with existing test suite.` and that the target file is unchanged.
  Learner check: Trigger the sample crash and confirm the terminal shows the replicate line, the formulating line, and a target file whose Jest suite now passes.
  Commit: `Verify crash with Jest and apply stubbed discount patch`

- [x] **3. A passing re-run opens one GitHub pull request, or logs the credential error and stops**
  Becomes usable: After the second Jest run passes, DevLens opens one pull request on a new branch and prints its URL, or prints the credential error and opens nothing. The pull request body includes the issue, the root cause, and the passing Jest output.
  Why now: The kernel's visible beat is the pull request. It comes after a fix that has already passed, so a bad patch cannot open one. Nothing else follows it.
  PRD ref: `prd.md > Verify the fix and open a pull request`, `prd.md > Abort without a pull request`
  Spec ref: `spec.md > GitHub publisher`, `spec.md > External Services and Dependencies`, `spec.md > The Core Journey Through the System`
  Build: Add `src/openPullRequest.js` using `@octokit/rest` and `GITHUB_TOKEN`. Create the branch, commit the patched file, and open the pull request only after the second Jest exit is zero. On publisher failure, log the credential error and do not report success.
  Verify (mechanical): Restore the sample bug so the first Jest run fails again. POST the crash with a valid token and confirm `[DevLens Agent] Fix verified! Pull Request opened: <PR_URL>.` and that the URL is a pull request containing the issue, root cause, and passing Jest output. Repeat with no token and confirm `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.` and that no new pull request exists.
  Learner check: Run the sample crash with your GitHub token set, open the printed URL, and confirm the pull request is the fix you expected. Then try once without the token and confirm the credential error and no pull request.
  Commit: `Open GitHub pull request after verified fix`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2, once the local Jest verification and GPT-4o patch work, before the pull request is added
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: not started
Route and stops: not started
Edit outcome: not started
Reflection: not started
Activity mode: not started

## Revisions

- Patch generation is a labeled stub of the sample discount fix instead of a live GPT-4o call — OpenAI returned `credit_balance_exhausted`, and the learner chose not to add credits.
- The early hands-on pause after slice 2 was skipped — the learner asked to commit the stub and proceed immediately to Slice 3.
- Passing Jest output is read from both stdout and stderr — a successful `npx jest` wrote the summary to stderr, so the first pull request body had an empty test section.
