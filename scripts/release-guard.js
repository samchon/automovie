// Release guard for `.github/workflows/release.yml`.
//
// A stable release is a pushed `vX.Y.Z` tag whose version every workspace
// manifest already carries (`pnpm release` bumps, commits, tags, and pushes
// them together). A prerelease is a manual `workflow_dispatch` on `master`
// that names the npm dist-tag (`rc` or `next`) and an exact prerelease
// version; the workflow bumps the manifests to that version before publishing.
//
// The script only reads files, prints, and exports environment variables; the
// `bump-if-needed` command rewrites manifests through `bumpp` without any git
// side effects. It never touches a registry, so it is safe as the first step.
//
// Usage:
//   node scripts/release-guard.js validate-context
//   node scripts/release-guard.js bump-if-needed
//   node scripts/release-guard.js validate-package-versions

"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");

const STABLE_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const PRERELEASE_PATTERNS = {
  rc: {
    pattern:
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-rc\.(0|[1-9][0-9]*)$/,
    example: "0.2.0-rc.0",
  },
  next: {
    pattern:
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-next\.(0|[1-9][0-9]*)$/,
    example: "0.2.0-next.0",
  },
};

const command = process.argv[2];

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function exportEnvironment(entries) {
  const text = Object.entries(entries)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  if (process.env.GITHUB_ENV)
    fs.appendFileSync(process.env.GITHUB_ENV, `${text}\n`);
  else console.log(text);
}

function packageJsonFiles() {
  return childProcess
    .execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(
      (file) => file === "package.json" || file.endsWith("/package.json"),
    );
}

// Every tracked manifest, private workspaces included, must carry the release
// version: `bumpp -r` bumps them together, so a stray value means a manual edit
// that the tag does not describe.
function assertPackageVersions(version) {
  if (!version) fail("RELEASE_VERSION is required");
  const mismatches = [];
  for (const file of packageJsonFiles()) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (json.version && json.version !== "0.0.0" && json.version !== version)
      mismatches.push(`${file}: ${json.version}`);
  }
  if (mismatches.length) {
    console.error(`Package versions must all be ${version}:`);
    for (const line of mismatches) console.error(`- ${line}`);
    process.exit(1);
  }
}

function validateContext() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const refName = process.env.GITHUB_REF_NAME ?? "";

  if (eventName === "push") {
    const match = /^v(.+)$/.exec(refName);
    if (!match || !STABLE_VERSION.test(match[1]))
      fail("release tag must be stable vX.Y.Z, for example v0.2.0");
    assertPackageVersions(match[1]);
    exportEnvironment({ NPM_TAG: "latest", RELEASE_VERSION: match[1] });
    return;
  }

  if (eventName === "workflow_dispatch") {
    const tag = process.env.INPUT_TAG;
    const version = process.env.INPUT_VERSION;
    if (refName !== "master")
      fail("manual prerelease publishing must run from master");
    const rule = PRERELEASE_PATTERNS[tag];
    if (!rule) fail("tag must be rc or next");
    if (!rule.pattern.test(version))
      fail(`tag '${tag}' requires version like ${rule.example}`);
    exportEnvironment({ NPM_TAG: tag, RELEASE_VERSION: version });
    return;
  }

  fail(`unsupported release event: ${eventName}`);
}

function bumpIfNeeded() {
  const version = process.env.RELEASE_VERSION;
  if (!version) fail("RELEASE_VERSION is required");
  const current = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  if (current === version) {
    console.log(`Version is already ${version}.`);
    return;
  }
  childProcess.execFileSync(
    "pnpm",
    [
      "exec",
      "bumpp",
      version,
      "--no-commit",
      "--no-tag",
      "--no-push",
      "--recursive",
      "--yes",
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
}

switch (command) {
  case "validate-context":
    validateContext();
    break;
  case "bump-if-needed":
    bumpIfNeeded();
    break;
  case "validate-package-versions":
    assertPackageVersions(process.env.RELEASE_VERSION);
    break;
  default:
    fail(
      "usage: release-guard.js <validate-context|bump-if-needed|validate-package-versions>",
    );
}
