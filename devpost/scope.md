---
doc: scope
status: approved
---

# DevLens

An autonomous background engineer for Node.js/Express services: a crash webhook comes in, and a verified GitHub pull request is waiting with the fix.

## The Unique Kernel
DevLens turns a production crash into a pull request before the developer notices. Instead of waking up to read traces, hunt the stack in an editor, and write a repetitive hotfix, the developer finds the fix already opened.

## Who It's For
Backend engineers, DevOps teams, and solo developers running production Node.js/Express services who want automated bug resolution. Today they wake up at 3 AM, read Sentry traces, manually trace stack traces in VS Code, and write repetitive hotfixes.

## The Core Loop
An Express app crashes and fires an error webhook with the stack trace and error message. DevLens catches it, parses the stack, and isolates the file and line. An LLM agent inspects that code, runs Jest to confirm the failure, and writes a targeted fix. DevLens runs Jest again, then opens a GitHub pull request on a new branch with the issue description, root cause, and passing test results. The developer comes back to a pull request in the inbox, not to a blank debugging session.

## Inspiration & Identity
It should feel like an autonomous background engineer, not a product you operate. The proof of concept is terminal logs plus the GitHub pull request UI. No other look-and-feel direction was named.

## Why This Matters to the Learner
The exciting part is eliminating manual context-switching during backend outages, and turning reactive firefighting into a proactive pull request. This build is also the place to practice a strict plan-first workflow, so the spec drives the code without scope creep.

## What "Working" Looks Like
A Node.js/Express crash fires a webhook. DevLens isolates the file and line, confirms the failure with Jest, applies a targeted fix, and re-runs Jest to a full pass with no regressions. It then opens one clean GitHub pull request containing the issue description, root cause analysis, and passing test results. The "oh, that's cool" beat is the pull request waiting in the inbox before the developer has started debugging. Demo surface: terminal logs and that GitHub pull request. Submissions need a short demo video and a public GitHub repository. Target is 2–4 hours of active work. Deployment is optional, and this proof stops before any deploy.

## The POC Boundary
In: one target repository, one Express error webhook (stack trace and error message), stack parsing to a file and line, an LLM agent that inspects the buggy code and writes a fix patch, Jest to confirm the failure and again to require a full pass, a new git branch, and one GitHub pull request with the issue description, root cause analysis, and passing test results. Visible surface is terminal logs and GitHub.

## Later
Nothing else was named as worth doing after this proof of concept.

## Explicitly Cut
- Complex SaaS frontend dashboard and auth system. The proof only needs terminal logs and the GitHub UI.
- Multi-repository orchestration. One target repository is enough to prove the loop.
- Auto-deployment pipelines. The proof stops at the verified pull request.
