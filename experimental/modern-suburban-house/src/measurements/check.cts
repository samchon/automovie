import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(__dirname, "../..");
const audit = path.join(__dirname, "model-contract-audit.cts");
import { failureCount as docsReviewFailures } from "./docs-review-host.cjs";
// npm supplies its JavaScript CLI path to scripts on every supported OS.
// Executing it through Node avoids cmd.exe and shell-dependent command chains.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this aggregate through npm run check");
const layer = process.argv.find((arg) => arg.startsWith("--layer="))?.slice("--layer=".length) ?? "all";
if (!["all", "spaces", "models", "settings"].includes(layer)) throw new Error(`Unknown check layer ${layer}`);
const layerTasks: Record<string, Set<string> | null> = {
  all: null,
  spaces: new Set([
    "tests",
    "door casing versus spaces",
    "geometry",
    "space relations",
    "paving union",
    "lint",
  ]),
  models: new Set([
    "model accounts",
    "reverse handoffs",
    "material hosts",
    "material bindings",
    "model face review candidates",
    "reviewed referents",
    "model contacts",
    "segmented panel sweep",
    "building interface sweep",
    "hinged attachment sweep",
    "building solid sweep",
    "door casing versus spaces",
    "tests",
    "lint",
  ]),
  settings: new Set(["settings review hosts"]),
};
const tasks: Array<[string, string, string[], "exit" | "accounts" | "handoffs" | "material-hosts" | "material-bindings" | "face-witnesses" | "referents" | "model-contacts" | "docs-review"]> = [
  ["model accounts", process.execPath, ["--import", "tsx", audit, "accounts"], "accounts"],
  ["reverse handoffs", process.execPath, ["--import", "tsx", audit, "handoffs"], "handoffs"],
  [
    "material hosts",
    process.execPath,
    ["--import", "tsx", audit, "material-hosts"],
    "material-hosts",
  ],
  [
    "material bindings",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "material-binding-scan.cts"), "--check"],
    "material-bindings",
  ],
  [
    "model face review candidates",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "face-witness-audit.cts"), "--building-strict"],
    "face-witnesses",
  ],
  [
    "reviewed referents",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "referent-owner-scan.cts"), "--check"],
    "referents",
  ],
  [
    "model contacts",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "model-contact-check.cts")],
    "model-contacts",
  ],
  [
    "segmented panel sweep",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "segmented-panel-sweep.cts")],
    "exit",
  ],
  [
    "building interface sweep",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "building-interface-sweep.cts")],
    "exit",
  ],
  [
    "hinged attachment sweep",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "hinged-attachment-sweep.cts")],
    "exit",
  ],
  [
    "building solid sweep",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "building-solid-sweep.cts")],
    "exit",
  ],
  [
    "door casing versus spaces",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "casing-space-scan.cts")],
    "exit",
  ],
  [
    "settings review hosts",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "docs-review-host.cts")],
    "docs-review",
  ],
  ["tests", process.execPath, [npmCli, "run", "test"], "exit"],
  ["geometry", process.execPath, [npmCli, "run", "geometry-audit"], "exit"],
  [
    "space relations",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "space-relations.cts")],
    "exit",
  ],
  [
    "paving union",
    process.execPath,
    ["--import", "tsx", path.join(__dirname, "paving-union-check.cts")],
    "exit",
  ],
  ["lint", process.execPath, [npmCli, "run", "lint"], "exit"],
];
let failed = 0;
for (const [name, command, args, kind] of tasks) {
  if (layerTasks[layer] !== null && !layerTasks[layer].has(name)) continue;
  const result = spawnSync(command, args, {
    windowsHide: true,
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
        errors += value.unowned + value.unlinkedAssignments + value.falseLinkedMakers + value.invalidExplicitClaims + value.invalidTableClaims + value.ambiguousBindingTables + value.unwitnessedModelPairs;
      } else if (kind === "face-witnesses") {
        errors += value.withoutLiteralFaceId + value.buildingRequiringManualReview;
      } else if (kind === "referents") {
        errors += Number(value.ledgerDiff) + value.ownerless;
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
