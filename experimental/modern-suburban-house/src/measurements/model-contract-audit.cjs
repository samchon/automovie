/** Read-only producers for the models gate. Run from this production with
 * `node src/measurements/model-contract-audit.cjs history [ref]` or `handoffs`.
 * The counts are derived from Git blobs / current parent-and-sibling docs,
 * never copied from a previous review. No source or account file is written.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const production = path.resolve(__dirname, "../..");
const repository = path.resolve(production, "../..");
const base = "experimental/modern-suburban-house";
/** @param {...string} args */
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
/** @param {string} value */
const sha = (value) => createHash("sha1").update(value).digest("hex");

/** @param {string} text */
function sections(text) {
  const out = new Map();
  /** @type {string | null} */
  let anchor = null;
  /** @type {string[]} */
  let lines = [];
  const flush = () => { if (anchor !== null) out.set(anchor, lines.join("\n")); };
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const match = /^## (.*?)(?:\s*\{#([^}]+)\})?\s*$/.exec(line);
    if (match) { flush(); anchor = match[2] ?? match[1]; lines = [line]; }
    else if (anchor !== null) lines.push(line);
  }
  flush();
  return out;
}
/** @param {string} section */
const body = (section) => section.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
/** @param {string} section */
const rows = (section) => [...section.matchAll(/^@evidence(?:Exclude|Review|ExcludeReview)? .*$/gm)].map((match) => match[0]);

/** @param {string} ref */
function history(ref) {
  const target = git("rev-parse", ref).trim();
  const files = git("ls-tree", "-r", "--name-only", target, `${base}/docs/models`).split("\n").filter((file) => file.endsWith(".md"));
  const stale = [];
  const all = [];
  let evidenceRows = 0;
  for (const file of files) {
    const commits = git("log", "--format=%H", target, "--", file).trim().split("\n").reverse();
    const timeline = new Map();
    for (const commit of commits) {
      try { git("cat-file", "-e", `${commit}:${file}`); } catch { continue; }
      const snapshot = sections(git("show", `${commit}:${file}`));
      for (const [anchor, section] of snapshot) {
        if (!timeline.has(anchor)) timeline.set(anchor, []);
        timeline.get(anchor).push({ commit: commit.slice(0, 8), body: sha(body(section)), rows: sha(rows(section).join("\n")), rowCount: rows(section).length });
      }
    }
    const current = sections(git("show", `${target}:${file}`));
    for (const [anchor, section] of current) {
      const events = timeline.get(anchor);
      if (!events?.length) throw new Error(`Missing history: ${file}#${anchor}`);
      let lastBody = 0;
      let lastRows = 0;
      for (let index = 1; index < events.length; index++) {
        if (events[index].body !== events[index - 1].body) lastBody = index;
        if (events[index].rows !== events[index - 1].rows) lastRows = index;
      }
      evidenceRows += rows(section).length;
      const id = `${file.slice(base.length + 1)}#${anchor}`;
      all.push(id);
      if (lastBody > lastRows && events.at(-1).rowCount) stale.push({ id, bodyCommit: events[lastBody].commit, rowCommit: events[lastRows].commit, rows: events.at(-1).rowCount });
    }
  }
  return { ref: target.slice(0, 8), files: files.length, h2: all.length, evidenceRows, staleCount: stale.length, stale, all };
}

/** @param {string} ref */
function historyChanges(ref) {
  const report = history(ref);
  const changes = report.stale.map(({ id, rowCommit }) => {
    const [file, anchor] = id.split("#");
    const source = `${base}/${file}`;
    const previous = sections(git("show", `${rowCommit}:${source}`)).get(anchor);
    const current = sections(git("show", `${report.ref}:${source}`)).get(anchor);
    if (!previous || !current) throw new Error(`Missing H2 for diff: ${id}`);
    /** @param {string} section */
    const sentences = (section) => body(section).split(/(?<=[.다])\s+/).map((line) => line.trim()).filter(Boolean);
    const oldLines = sentences(previous);
    const newLines = sentences(current);
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    return { id, removed: oldLines.filter((line) => !newSet.has(line)), added: newLines.filter((line) => !oldSet.has(line)) };
  });
  return { ref: report.ref, checkedH2: report.h2, changedSinceRows: changes.length, changes };
}

/** @type {{ korean: string[], english: string[] }} */
const lexicon = JSON.parse(fs.readFileSync(path.join(__dirname, "model-handoff-lexicon.json"), "utf8"));
const expressions = [
  ...lexicon.korean.map((term) => new RegExp(term, "i")),
  // ASCII-only boundaries deliberately match `cabinet과` / `shade를` but not
  // `bedroom`, `stable`, or `materials` for bed/table/mat.
  ...lexicon.english.map((term) => new RegExp(`(?<![A-Za-z0-9_])(?:${term})(?![A-Za-z0-9_])`, "i")),
];
/** @param {string} term @returns {RegExp} */
function expressionFor(term) {
  const result = expressions.find((item) => item.source.includes(term));
  if (!result) throw new Error(`Missing vocabulary term: ${term}`);
  return result;
}
if (!expressionFor("cabinet").test("cabinet과") ||
    !expressionFor("shade").test("shade를") ||
    expressionFor("bed").test("bedroom") ||
    expressionFor("mat").test("materials")) throw new Error("ASCII boundary regression");

/** @param {string} dir @returns {string[]} */
function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(full) : entry.name.endsWith(".md") ? [full] : [];
  });
}
function handoffs() {
  const roots = ["settings", "spaces", "systems", "materials"].map((dir) => path.join(production, "docs", dir));
  const files = roots.flatMap(markdownFiles);
  const candidates = [];
  for (const file of files) {
    for (const [anchor, section] of sections(fs.readFileSync(file, "utf8"))) {
      const plain = body(section);
      const terms = [...lexicon.korean, ...lexicon.english].filter((_, index) => expressions[index].test(plain));
      if (terms.length) candidates.push({ id: `${path.relative(production, file).replace(/\\/g, "/")}#${anchor}`, terms });
    }
  }
  const account = fs.readFileSync(path.join(production, "docs/accounts/models/surface-ownership.md"), "utf8");
  const table = account.split("| 부모·형제 H2 | 넘긴 요소군 | 모델 설계 owner |")[1]?.split("어휘 적중 중 모델 원형 인계가 아닌 것은")[0];
  if (!table) throw new Error("Missing reverse handoff table");
  const rows = table.split("\n").filter((line) => line.startsWith("| [") && line.split("|").length === 5);
  const ownerless = rows.filter((line) => !/\]\(\.\.\/\.\.\/models\/[^)]+\)/.test(line.split("|")[3])).map((line) => line.split("|")[1].trim());
  return { files: files.length, vocabulary: expressions.length, candidateH2: candidates.length, accountRows: rows.length, ownerlessRows: ownerless.length, ownerless, candidates };
}

const command = process.argv[2];
if (command === "history") console.log(JSON.stringify(history(process.argv[3] ?? "HEAD"), null, 2));
else if (command === "history-changes") console.log(JSON.stringify(historyChanges(process.argv[3] ?? "HEAD"), null, 2));
else if (command === "handoffs") console.log(JSON.stringify(handoffs(), null, 2));
else { console.error("usage: node src/measurements/model-contract-audit.cjs history [ref] | history-changes [ref] | handoffs"); process.exitCode = 2; }
