/** Check every docs/spaces review quotation against the authored docs corpus. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");

function classifyQuotes(tsv) {
  const rows = tsv.trim().split(/\r?\n/).filter(Boolean);
  const failures = rows.filter((line) => {
    const status = line.split("\t")[3] ?? "";
    return !/^(HOST|TARGET|ELSEWHERE:)/.test(status);
  });
  return { checked: rows.length, failures };
}

function run(probes) {
  const logs = path.join(root, ".wiki", "stage3-review-check");
  fs.mkdirSync(logs, { recursive: true });
  const docs = path.join(root, "docs");
  const rowsFile = path.join(logs, "docs-spaces-rows.json");
  const quotesPrefix = path.join(logs, "docs-spaces-quotes");
  const extract = spawnSync(process.execPath, [
    path.join(probes, "1952-docs-rows-extract.mjs"), docs, rowsFile,
    "spaces", "spaces/rooms", "spaces/envelope", "spaces/roof", "spaces/site",
  ], { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 });
  if (extract.status !== 0) return { status: extract.status ?? 1, message: extract.stderr || extract.stdout };
  const extracted = JSON.parse(fs.readFileSync(rowsFile, "utf8"));
  if (extracted.rows.length < 1182 || extracted.rows.some((row) => !row.target)) {
    return { status: 1, message: `docs/spaces rows missing or malformed: ${extracted.rows.length}` };
  }
  const quoted = spawnSync(process.execPath, [
    path.join(probes, "1952-docs-quote-check-all.cjs"), docs, rowsFile, "1", quotesPrefix,
  ], { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 });
  if (quoted.status !== 0) return { status: quoted.status ?? 1, message: quoted.stderr || quoted.stdout };
  const { checked, failures } = classifyQuotes(fs.readFileSync(`${quotesPrefix}.tsv`, "utf8"));
  return {
    status: checked > 0 && failures.length === 0 ? 0 : 1,
    message: `${extracted.rows.length} review rows, ${checked} quoted spans, ${failures.length} unmatched spans\n${failures.join("\n")}`,
  };
}

if (require.main === module) {
  const probes = process.argv[2];
  if (!probes) {
    console.error("usage: node docs-spaces-review-quotes.cjs <probe-directory>");
    process.exitCode = 2;
  } else {
    const result = run(path.resolve(probes));
    console.log(result.message);
    process.exitCode = result.status;
  }
}

module.exports = { classifyQuotes, run };
