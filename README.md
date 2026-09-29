# DevLens 🔍 🤖

An Autonomous AI Software Engineer that automatically detects application runtime crashes, verifies fixes with tests, and creates GitHub Pull Requests.

---

## ⚡ Key Features

- **Crash Detection:** Listens to runtime crash webhooks.
- **Plan-First AI:** Reads rules from `devpost/` (`scope.md`, `prd.md`, `spec.md`, `checklist.md`).
- **Test Verification:** Reproduces and validates fixes via local Jest tests.
- **Automated PRs:** Generates ready-to-merge Pull Requests on GitHub.

---

## 🏗️ Workflow

```text
[ App Crash ] ──► [ Webhook Event ] ──► [ DevLens Agent ] ◄── [ devpost/ Docs ]
                                               │
[ GitHub PR ] ◄── [ Code Fix ] ◄── [ Jest Test Verification ]
```

## 🚀 Quick Setup

# 1. Clone repository
git clone [https://github.com/Muhammad-Husnain007/ai-basics.git]
cd devlens

# 2. Install dependencies
npm install

# 3. Create .env file
echo "GITHUB_TOKEN=your_token_here" > .env
echo "REPO_OWNER=your_username" >> .env
echo "REPO_NAME=devlens" >> .env

# 4. Start DevLens server
npm start

# 5. Run crash trigger (in another terminal)
node trigger.js

🛠️ Tech Stack

Node.js • JavaScript • Jest • GitHub API • Webhooks • AI Agent Framework
