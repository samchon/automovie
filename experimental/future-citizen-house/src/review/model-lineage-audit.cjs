// Check that model evidence names only settings/space parents carried by its H2.
// Prose still needs literal review; this catches exact names and truncated anchors.
const fs = require("node:fs");
const path = require("node:path");

const docsRoot = path.resolve(__dirname, "../../docs");

function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith(".md") ? [file] : [];
  });
}

function readUnits(root, family) {
  return markdownFiles(path.join(root, family)).flatMap((file) => {
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const units = [];
    for (const [index, line] of fs.readFileSync(file, "utf8").split(/\r?\n/).entries()) {
      const heading = line.match(/^##\s+.*\{#([^}]+)\}\s*$/);
      if (heading) units.push({ file: relative, anchor: heading[1], rows: [] });
      else if (units.length) units.at(-1).rows.push({ line: index + 1, text: line });
    }
    return units;
  });
}

function mentions(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9-])${escaped}(?![A-Za-z0-9-])`).test(text);
}

function audit(parents, models) {
  const names = new Map();
  for (const parent of parents) {
    if (!names.has(parent.anchor)) names.set(parent.anchor, new Set());
    names.get(parent.anchor).add(`${parent.file}#${parent.anchor}`);
  }
  const errors = [];
  let rows = 0;
  for (const model of models) {
    const host = `${model.file}#${model.anchor}`;
    const cited = new Set(model.rows.flatMap(({ text }) => {
      const match = text.match(/^@evidence\s+((?:settings|spaces)\/[^\s#]+#[^\s]+)/);
      return match ? [match[1]] : [];
    }));
    if (!cited.size) errors.push(`${host}: no positive settings/spaces parent`);
    for (const { line, text } of model.rows) {
      if (!/^@evidence(?:Exclude)?\s+(?:principles\/core\/(?:common\.md#declared-basis|inherited-units\.md#derived-parent-differentiation)|upstream\/design\/models\.md#settings-and-space-revision-from-model-work)\s+/.test(text)) continue;
      rows++;
      const prose = text.replace(/^@evidence(?:Exclude)?\s+\S+\s+/, "");
      const named = [...names].filter(([name]) => mentions(prose, name));
      for (const [name, targets] of named) {
        if (![...targets].some((target) => cited.has(target)))
          errors.push(`${host}:${line}: ${name} has no positive lineage citation`);
      }
      for (const token of prose.match(/[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g) || []) {
        if (!names.has(token) && [...names.keys()].some((name) => name.startsWith(`${token}-`)))
          errors.push(`${host}:${line}: ${token} is not a parent anchor`);
      }
      if (/derived-parent-differentiation|settings-and-space-revision-from-model-work/.test(text) &&
          !named.some(([, targets]) => [...targets].some((target) => cited.has(target))))
        errors.push(`${host}:${line}: parent answer names no cited parent`);
    }
  }
  return { hosts: models.length, rows, errors };
}

if (process.argv.includes("--fixture")) {
  const parents = [{ file: "settings/a.md", anchor: "ground-program" }, { file: "spaces/a.md", anchor: "child-bedroom-1" }];
  const base = [
    { line: 1, text: "@evidence settings/a.md#ground-program text" },
    { line: 2, text: "@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 물체" },
    { line: 3, text: "@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 결정" },
  ];
  const model = (rows) => [{ file: "models/a.md", anchor: "object", rows }];
  let red = 0;
  const expect = (rows, fragment, shouldFail) => {
    const result = audit(parents, model(rows));
    if (result.errors.some((error) => error.includes(fragment)) !== shouldFail)
      throw new Error(`${fragment}: ${JSON.stringify(result.errors)}`);
    if (shouldFail) red++;
  };
  expect(base, "has no positive lineage citation", false);
  expect(base.slice(1), "no positive settings/spaces parent", true);
  expect(base.map((row) => row.line === 2 ? { ...row, text: row.text.replace("ground-program", "child-bedroom-1") } : row), "has no positive lineage citation", true);
  expect(base.map((row) => row.line === 2 ? { ...row, text: row.text.replace("ground-program", "child-bedroom") } : row), "is not a parent anchor", true);
  expect(base.map((row) => row.line === 2 ? { ...row, text: row.text.replace("ground-program", "unowned-object") } : row), "parent answer names no cited parent", true);
  expect([...base, { line: 4, text: "@evidence principles/core/common.md#declared-basis child-bedroom-1의 바닥" }], "has no positive lineage citation", true);
  console.log(`model-lineage-audit.cjs --fixture: PASS (${red} red mutations)`);
} else {
  const result = audit([...readUnits(docsRoot, "settings"), ...readUnits(docsRoot, "spaces")], readUnits(docsRoot, "models"));
  console.log(`model lineage: ${result.hosts} H2, ${result.rows} parent-answer rows, ${result.errors.length} errors`);
  for (const error of result.errors) console.error(error);
  if (result.errors.length || !result.hosts || !result.rows) process.exitCode = 1;
}
