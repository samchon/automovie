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

/** Compare current H2 prose and evidence rows with the committed tree. A count
 * identifies review work; it does not decide whether a carried row is true. */
function workingChanges() {
  const directories = ["models", "spaces", "materials", "systems", "accounts/models", "accounts/materials"].map((name) => path.join(production, "docs", name));
  const files = directories.flatMap(markdownFiles);
  const changes = [];
  const changedTargets = new Set();
  const current = [];
  for (const file of files) {
    const relative = path.relative(production, file).replace(/\\/g, "/");
    const previous = sections(git("show", `HEAD:${base}/${relative}`));
    for (const [anchor, section] of sections(fs.readFileSync(file, "utf8"))) {
      const id = `${relative}#${anchor}`;
      const old = previous.get(anchor);
      const oldRows = old ? rows(old) : [];
      const newRows = rows(section);
      const bodyChanged = !old || body(old) !== body(section);
      const rowsChanged = !old || oldRows.join("\n") !== newRows.join("\n");
      const carriedRows = old ? newRows.filter((row) => oldRows.includes(row)) : [];
      if (bodyChanged || rowsChanged) changes.push({ id, bodyChanged, rowsChanged, oldRows: oldRows.length, newRows: newRows.length, carriedRows: carriedRows.length });
      if (bodyChanged) changedTargets.add(id);
      current.push({ id, file, section });
    }
  }
  const dependent = [];
  for (const { id, file, section } of current) {
    const targets = new Set();
    for (const line of rows(section)) {
      const match = /^@evidence(?:Exclude|Review|ExcludeReview)?\s+((?:models|spaces|materials|systems)\/[^#\s]+#[^\s]+)/.exec(line);
      if (match) targets.add(`docs/${match[1]}`);
    }
    for (const [, relative, anchor] of section.matchAll(/\]\(([^)#]+)#([^)]+)\)/g)) {
      const target = path.resolve(path.dirname(file), relative);
      if (target.startsWith(path.join(production, "docs") + path.sep)) targets.add(`${path.relative(production, target).replace(/\\/g, "/")}#${anchor}`);
    }
    const changedParents = [...targets].filter((target) => changedTargets.has(target));
    if (changedParents.length && !changedTargets.has(id)) dependent.push({ id, changedParents });
  }
  return { files: files.length, changedH2: changes.length, changedBodies: changedTargets.size, changedH2Rows: changes, dependentH2: dependent.length, dependent };
}

/** @type {{ korean: string[], english: string[] }} */
const lexicon = require("./model-handoff-lexicon.cjs");
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
  const table = account.split("| 부모·형제 H2 | 넘긴 요소군 또는 비인계 응답 | 설계 owner |")[1]?.split("어휘 적중 중 모델 원형 인계가 아닌 것은")[0];
  if (!table) throw new Error("Missing reverse handoff table");
  const rows = table.split("\n").filter((line) => line.startsWith("| [") && line.split("|").length === 5);
  const ownerless = [];
  const invalidParentLinks = [];
  const invalidOwnerLinks = [];
  const accountPath = path.join(production, "docs/accounts/models/surface-ownership.md");
  for (const line of rows) {
    const [parent, element, owner] = line.split("|").slice(1, 4).map((cell) => cell.trim());
    const parentLinks = [...parent.matchAll(/\]\((\.\.\/\.\.\/(?:settings|spaces|systems|materials)\/[^#)]+)#([^)]+)\)/g)];
    const links = [...owner.matchAll(/\]\((\.\.\/\.\.\/(?:models|materials)\/[^#)]+)#([^)]+)\)/g)];
    if (!parent || !element || parentLinks.length === 0 || links.length === 0) ownerless.push({ parent, element });
    for (const [, relative, anchor] of parentLinks) {
      const file = path.resolve(path.dirname(accountPath), relative);
      if (!fs.existsSync(file) || !sections(fs.readFileSync(file, "utf8")).has(anchor)) invalidParentLinks.push({ parent, element, target: `${relative}#${anchor}` });
    }
    for (const [, relative, anchor] of links) {
      const file = path.resolve(path.dirname(accountPath), relative);
      if (!fs.existsSync(file) || !sections(fs.readFileSync(file, "utf8")).has(anchor)) invalidOwnerLinks.push({ parent, element, target: `${relative}#${anchor}` });
    }
  }
  const cited = new Set();
  for (const file of [...markdownFiles(path.join(production, "docs/models")), ...markdownFiles(path.join(production, "docs/accounts/models"))]) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\]\(([^)#]+)#([^)]*)\)/g)) {
      const target = path.resolve(path.dirname(file), match[1]);
      if (target.startsWith(path.join(production, "docs") + path.sep)) cited.add(`${path.relative(production, target).replace(/\\/g, "/")}#${match[2]}`);
    }
    for (const match of source.matchAll(/^@evidence(?:Exclude|Review|ExcludeReview)?\s+((?:settings|spaces|systems|materials)\/[^#\s]+)#([^\s]+)/gm))
      cited.add(`docs/${match[1]}#${match[2]}`);
  }
  const uncited = candidates.map((candidate) => candidate.id).filter((id) => !cited.has(id));
  return { files: files.length, vocabulary: expressions.length, candidateH2: candidates.length, citedCandidateH2: candidates.length - uncited.length, uncitedCandidateH2: uncited, accountRows: rows.length, ownerlessRows: ownerless.length, ownerless, invalidParentLinks, invalidOwnerLinks, candidates };
}

function accounts() {
  const modelFiles = markdownFiles(path.join(production, "docs/models"));
  const all = new Set(modelFiles.flatMap((file) => [...sections(fs.readFileSync(file, "utf8")).keys()].map((anchor) => `docs/models/${path.basename(file)}#${anchor}`)));
  const results = ["reservation-fit.md", "surface-ownership.md"].map((name) => {
    const file = path.join(production, "docs/accounts/models", name);
    const ids = [...fs.readFileSync(file, "utf8").matchAll(/^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \|/gm)].map((match) => `docs/models/${match[1]}#${match[2]}`);
    const seen = new Set(ids);
    return { name, rows: ids.length, distinct: seen.size, missing: [...all].filter((id) => !seen.has(id)), extra: [...seen].filter((id) => !all.has(id)) };
  });
  return { modelFiles: modelFiles.length, h2: all.size, accounts: results };
}

function assertionRows() {
  const files = [...markdownFiles(path.join(production, "docs/models")), ...markdownFiles(path.join(production, "docs/accounts/models"))];
  const rows = files.flatMap((file) => fs.readFileSync(file, "utf8").split(/\r?\n/).flatMap((line, index) =>
    /^@evidence(?:Review|Exclude|ExcludeReview)? .*(?:전부|0건|일치|대조했다)/.test(line)
      ? [{ file: path.relative(production, file).replace(/\\/g, "/"), line: index + 1, text: line }]
      : []));
  return { files: files.length, rowCount: rows.length, rows };
}

const command = process.argv[2];
if (command === "history") console.log(JSON.stringify(history(process.argv[3] ?? "HEAD"), null, 2));
else if (command === "history-changes") console.log(JSON.stringify(historyChanges(process.argv[3] ?? "HEAD"), null, 2));
else if (command === "working-changes") console.log(JSON.stringify(workingChanges(), null, 2));
else if (command === "handoffs") console.log(JSON.stringify(handoffs(), null, 2));
else if (command === "accounts") console.log(JSON.stringify(accounts(), null, 2));
else if (command === "assertion-rows") console.log(JSON.stringify(assertionRows(), null, 2));
else { console.error("usage: node src/measurements/model-contract-audit.cjs history [ref] | history-changes [ref] | working-changes | handoffs | accounts | assertion-rows"); process.exitCode = 2; }
