/** Runs production measurements, review-host checks, tests and lint even when
 * an earlier task fails. A zero exit requires every configured task to run. */
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const audit = path.join(__dirname, "model-contract-audit.cjs");
const { failureCount: docsReviewFailures } = require("./docs-review-host.cjs");
// npm supplies its JavaScript CLI path to scripts on every supported OS.
// Executing it through Node avoids cmd.exe and shell-dependent command chains.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this aggregate through npm run check");
const layer = process.argv.find((arg) => arg.startsWith("--layer="))?.slice("--layer=".length) ?? "all";
if (!["all", "spaces", "models", "settings"].includes(layer)) throw new Error(`Unknown check layer ${layer}`);
/** @type {Record<string, Set<string> | null>} */
const layerTasks = {
  all: null,
  spaces: new Set(["door casing versus spaces", "geometry", "lint"]),
  models: new Set([
    "model accounts",
    "reverse handoffs",
    "material hosts",
    "material bindings",
    "model face review candidates",
    "reviewed referents",
    "model contacts",
  ]),
  settings: new Set(["settings review hosts"]),
};
/** @type {Array<[string, string, string[], "exit" | "accounts" | "handoffs" | "material-hosts" | "material-bindings" | "face-witnesses" | "referents" | "model-contacts" | "docs-review"]>} */
const tasks = [
  ["model accounts", process.execPath, [audit, "accounts"], "accounts"],
  ["reverse handoffs", process.execPath, [audit, "handoffs"], "handoffs"],
  [
    "material hosts",
    process.execPath,
    [audit, "material-hosts"],
    "material-hosts",
  ],
  [
    "material bindings",
    process.execPath,
    [path.join(__dirname, "material-binding-scan.cjs"), "--check"],
    "material-bindings",
  ],
  [
    "model face review candidates",
    process.execPath,
    [path.join(__dirname, "face-witness-audit.cjs"), "--strict"],
    "face-witnesses",
  ],
  [
    "reviewed referents",
    process.execPath,
    [path.join(__dirname, "referent-owner-scan.cjs"), "--check"],
    "referents",
  ],
  [
    "model contacts",
    process.execPath,
    [path.join(__dirname, "model-contact-check.cjs")],
    "model-contacts",
  ],
  [
    "door casing versus spaces",
    process.execPath,
    [path.join(__dirname, "casing-space-scan.cjs")],
    "exit",
  ],
  [
    "settings review hosts",
    process.execPath,
    [path.join(__dirname, "docs-review-host.cjs")],
    "docs-review",
  ],
  ["tests", process.execPath, [npmCli, "run", "test"], "exit"],
  ["geometry", process.execPath, [npmCli, "run", "geometry-audit"], "exit"],
  ["lint", process.execPath, [npmCli, "run", "lint"], "exit"],
];
let failed = 0;
for (const [name, command, args, kind] of tasks) {
  if (layerTasks[layer] !== null && !layerTasks[layer].has(name)) continue;
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 25,
  });
  if (result.stdout) {
    let visible = result.stdout;
    if (kind === "handoffs" && result.status === 0) {
      try {
        const value = JSON.parse(result.stdout);
        visible = JSON.stringify({ files: value.files, vocabulary: value.vocabulary, candidateH2: value.candidateH2, citedCandidateH2: value.citedCandidateH2, accountRows: value.accountRows, ownerlessRows: value.ownerlessRows, invalidParentLinks: value.invalidParentLinks.length, invalidOwnerLinks: value.invalidOwnerLinks.length }) + "\n";
      } catch {
        // Keep the malformed producer output visible; the census parser below fails it.
      }
    }
    process.stdout.write(`\n[${name}]\n${visible}`);
  }
  if (result.stderr) process.stderr.write(`\n[${name}]\n${result.stderr}`);
  let errors = result.status === 0 ? 0 : 1;
  if (kind !== "exit") {
    try {
      const value = JSON.parse(result.stdout);
      errors = 0;
      if (kind === "accounts") {
        for (const account of value.accounts) errors += account.missing.length + account.extra.length + (account.rows - account.distinct);
      } else if (kind === "handoffs") {
        errors += value.ownerlessRows + value.invalidParentLinks.length + value.invalidOwnerLinks.length + value.uncitedCandidateH2.length;
      } else if (kind === "material-hosts") {
        errors += value.missing.length + value.extra.length + value.duplicates.length + value.empty.length + value.invalid.length;
      } else if (kind === "material-bindings") {
        errors += value.unowned + value.unlinkedAssignments + value.falseLinkedMakers + value.invalidExplicitClaims + value.invalidTableClaims + value.unwitnessedModelPairs;
      } else if (kind === "face-witnesses") {
        errors += value.requiringManualReview;
      } else if (kind === "referents") {
        errors += Number(value.ledgerDiff) + value.ownerless + value.unregisteredTerms;
      } else if (kind === "model-contacts") {
        errors += value.failures.length;
      } else if (kind === "docs-review") {
        errors += docsReviewFailures(value);
      }
    } catch (error) {
      process.stderr.write(`[${name}] could not parse census: ${error}\n`);
      errors = Math.max(errors, 1);
    }
  }
  if (result.status !== 0) errors = Math.max(errors, 1);
  console.log(
    `[${name}] exit=${result.status ?? "spawn-error"} failures=${errors}`,
  );
  failed += errors;
}
console.log(`production check layer=${layer} failures=${failed}`);
if (failed > 0) process.exitCode = 1;
