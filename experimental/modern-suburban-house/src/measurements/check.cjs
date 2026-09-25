/** Runs every production measurement even when an earlier one fails. */
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const audit = path.join(__dirname, "model-contract-audit.cjs");
/** @type {Array<[string, string, string[], "exit" | "accounts" | "handoffs" | "material-hosts"]>} */
const tasks = [
  ["model accounts", process.execPath, [audit, "accounts"], "accounts"],
  ["reverse handoffs", process.execPath, [audit, "handoffs"], "handoffs"],
  ["material hosts", process.execPath, [audit, "material-hosts"], "material-hosts"],
  ["material bindings", process.execPath, [path.join(__dirname, "material-binding-scan.cjs"), "--check"], "exit"],
  ["reviewed referents", process.execPath, [path.join(__dirname, "referent-owner-scan.cjs"), "--check"], "exit"],
  ["geometry", "cmd.exe", ["/d", "/s", "/c", "npm run geometry-audit"], "exit"],
  ["lint", "cmd.exe", ["/d", "/s", "/c", "npm run lint"], "exit"],
];
let failed = 0;
for (const [name, command, args, kind] of tasks) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 25,
  });
  if (result.stdout) {
    const visible = kind === "handoffs" && result.status === 0
      ? (() => {
        const value = JSON.parse(result.stdout);
        return JSON.stringify({ files: value.files, vocabulary: value.vocabulary, candidateH2: value.candidateH2, citedCandidateH2: value.citedCandidateH2, accountRows: value.accountRows, ownerlessRows: value.ownerlessRows, invalidParentLinks: value.invalidParentLinks.length, invalidOwnerLinks: value.invalidOwnerLinks.length }) + "\n";
      })()
      : result.stdout;
    process.stdout.write(`\n[${name}]\n${visible}`);
  }
  if (result.stderr) process.stderr.write(`\n[${name}]\n${result.stderr}`);
  let errors = result.status === 0 ? 0 : 1;
  if (result.status === 0 && kind !== "exit") {
    try {
      const value = JSON.parse(result.stdout);
      if (kind === "accounts") {
        for (const account of value.accounts) errors += account.missing.length + account.extra.length + (account.rows - account.distinct);
      } else if (kind === "handoffs") {
        errors += value.ownerlessRows + value.invalidParentLinks.length + value.invalidOwnerLinks.length + value.uncitedCandidateH2.length;
      } else if (kind === "material-hosts") {
        errors += value.missing.length + value.extra.length + value.duplicates.length + value.empty.length + value.invalid.length;
      }
    } catch (error) {
      process.stderr.write(`[${name}] could not parse census: ${error}\n`);
      errors++;
    }
  }
  console.log(`[${name}] exit=${result.status ?? "spawn-error"} failures=${errors}`);
  failed += errors;
}
console.log(`production check failures=${failed}`);
if (failed > 0) process.exitCode = 1;
