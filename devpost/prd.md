---
doc: prd
status: approved
---

# DevLens — Product Requirements

An autonomous background engineer for backend engineers, DevOps teams, and solo developers running a Node.js/Express service. A crash webhook comes in. The terminal shows each step. A GitHub pull request is opened only after unit tests verify the fix.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. An Express app crashes and sends an error webhook with the error message and stack trace.
2. The terminal immediately logs `[DevLens Agent] Crash Received.`
3. If the payload has no usable file and line number, the terminal logs `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` and the process aborts. No pull request is opened.
4. Otherwise the terminal logs the parsed error message and stack trace, including the target file and line number.
5. The terminal logs `[DevLens Agent] Running local unit tests (Jest) to replicate bug....`
6. If Jest does not fail, the terminal logs `[DevLens Agent] Error: Unable to replicate crash with existing test suite.` and the process aborts. No pull request is opened.
7. If Jest fails as expected, the terminal logs `[DevLens Agent] Formulating AI fix patch & re-running tests....`
8. If the generated fix does not pass Jest, the terminal logs `[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.` and the process aborts. No pull request is opened.
9. If the re-run passes but the GitHub pull request cannot be opened, the terminal logs `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.` and the process aborts. No pull request is opened.
10. If the re-run passes and the pull request opens, the terminal logs `[DevLens Agent] Fix verified! Pull Request opened: <PR_URL>.`
11. The developer opens that URL and finds one pull request with the issue description, root cause analysis, and passing test results.

## Screens and Layout
Two surfaces. DevLens itself is terminal-only and minimal. The second surface is the GitHub pull request that the success log links to. There is no dashboard and no login screen.
Source: `scope.md > Inspiration & Identity`, `scope.md > The POC Boundary`.

## Look and Feel
Minimal terminal log. Every DevLens status line is prefixed `[DevLens Agent]`. Errors use that same prefix plus `Error:`. The success line includes the pull request URL. No other visual direction was set.

## Features and Behavior

### Receive a crash webhook
When a webhook arrives, the terminal prints the crash header, then the parsed error message and stack trace with the target file and line number.

- [ ] The first line after a received webhook is exactly `[DevLens Agent] Crash Received.`
- [ ] The following log includes the error message, the stack trace, and the identified file and line number.
- [ ] A payload with no usable file and line logs `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` and opens no pull request.

### Replicate the crash with unit tests
DevLens runs the local Jest suite to replicate the bug before any fix is attempted.

- [ ] Before the first Jest run, the terminal shows `[DevLens Agent] Running local unit tests (Jest) to replicate bug....`
- [ ] A first run that does not fail logs `[DevLens Agent] Error: Unable to replicate crash with existing test suite.` and opens no pull request.

### Verify the fix and open a pull request
After the crash is replicated, DevLens formulates a fix, re-runs Jest, and opens a pull request only when that re-run passes.

- [ ] After a failing first run, the terminal shows `[DevLens Agent] Formulating AI fix patch & re-running tests....`
- [ ] A re-run that does not pass logs `[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.` and opens no pull request.
- [ ] A re-run that passes, when the pull request cannot be opened, logs `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.` and opens no pull request.
- [ ] A re-run that passes, when the pull request opens, logs `[DevLens Agent] Fix verified! Pull Request opened: <PR_URL>.` and the URL is the pull request that was opened.
- [ ] That pull request contains the issue description, the root cause analysis, and the passing test results.
- [ ] The pull request is on a new branch of the single target repository.

### Abort without a pull request
A broken or unverified result never becomes a pull request.

- [ ] No pull request exists after a payload with no usable file and line.
- [ ] No pull request exists after a first Jest run that does not fail.
- [ ] No pull request exists after a generated fix that fails Jest.
- [ ] No pull request exists when opening the pull request fails after local verification.

## States and Boundaries

- **Crash received** — header, parsed error, file, and line are logged, then the replicate step starts.
- **Unusable file or line** — `[DevLens Agent] Error: Unable to parse file and line number from crash payload.` is logged, the process aborts, and no pull request is opened.
- **Unable to replicate** — the unable-to-replicate error is logged, the process aborts, and no pull request is opened.
- **Fix failed verification** — the failed-fix error is logged, the process aborts, and no pull request is opened.
- **Fix verified locally, pull request failed** — `[DevLens Agent] Error: Fix verified locally, but failed to open GitHub Pull Request. Check API credentials.` is logged, the process aborts, and no pull request is opened.
- **Fix verified** — the success line includes a real pull request URL, and that pull request holds the issue description, root cause analysis, and passing test results.
- **One repository** — the proof targets a single repository. Source: `scope.md > The POC Boundary`.

## Product Decisions

- Terminal-only DevLens output, plus the GitHub pull request as the place the developer reads the fix — a dashboard would not help prove the loop.
- Exact log lines above — the demo is checkable by reading the terminal.
- Abort with no pull request when the first Jest run does not fail — an unreproduced crash is not a verified fix.
- Abort with no pull request when the generated fix fails Jest — only a fix that passes unit tests may open a pull request.
- Learner stated these abort cases complete the product behavior for a broken happy path.
- Abort with no pull request when the file and line cannot be parsed — there is no target to fix.
- After local verification, log the credential error and abort when the GitHub pull request cannot be opened — a verified fix that never opens is not a success.

## What We're Building
A minimal terminal agent that receives one Express crash webhook, logs the parsed file and line, replicates the crash with Jest, formulates a fix, re-runs Jest, and opens one GitHub pull request only when that re-run passes. The pull request includes the issue description, root cause analysis, and passing test results.

## Deferred From the POC
None named beyond the cuts below. Source: `scope.md > Later`.

## Possible Later Enhancements
None named.

## Non-Goals
Source: `scope.md > Explicitly Cut`.

- No SaaS frontend dashboard and no auth system. Terminal logs and the GitHub pull request are the surfaces.
- No multi-repository orchestration. One target repository proves the loop.
- No auto-deployment. The proof stops at the verified pull request.
- No pull request for an unreproduced crash or a fix that fails Jest.

## Open Questions
None. The learner stated the edge cases above complete the PRD.
