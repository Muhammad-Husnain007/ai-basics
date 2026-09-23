import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Octokit } from "@octokit/rest";

function git(command, cwd) {
  return execSync(`git ${command}`, {
    cwd,
    encoding: "utf8",
    shell: true,
  }).trim();
}

export function resolveRepo(targetRepoPath) {
  const root = git("rev-parse --show-toplevel", targetRepoPath);
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (owner && repo) return { owner, repo, root };

  const remote = git("remote get-url origin", root);
  const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/i);
  if (!match) {
    const error = new Error("Unable to read GitHub owner and repo");
    error.code = "GITHUB_REPO";
    throw error;
  }
  return { owner: match[1], repo: match[2], root };
}

export async function openPullRequest({
  targetRepoPath,
  filePath,
  message,
  stack,
  lineNumber,
  testOutput,
}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    const error = new Error("Missing GITHUB_TOKEN");
    error.code = "GITHUB_AUTH";
    throw error;
  }

  const { owner, repo, root } = resolveRepo(targetRepoPath);
  const relativePath = path.relative(root, filePath).split(path.sep).join("/");
  const octokit = new Octokit({
    auth: token,
    log: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const { data: repository } = await octokit.rest.repos.get({ owner, repo });
  const base = repository.default_branch;
  const { data: baseRef } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${base}`,
  });
  const branch = `devlens/fix-${Date.now()}`;
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseRef.object.sha,
  });

  let sha;
  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: relativePath,
      ref: branch,
    });
    if (!Array.isArray(existing.data)) sha = existing.data.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: relativePath,
    message: `Fix ${message || "crash"}`,
    content: Buffer.from(fs.readFileSync(filePath, "utf8")).toString("base64"),
    branch,
    sha,
  });

  const body = [
    "## Issue",
    message || "Crash reported by webhook.",
    "",
    "## Root cause",
    `${relativePath}:${lineNumber}`,
    "",
    stack || "",
    "",
    "## Passing tests",
    testOutput || "",
  ].join("\n");

  const pull = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `DevLens: ${message || "verified crash fix"}`,
    head: branch,
    base,
    body,
  });
  return pull.data.html_url;
}
