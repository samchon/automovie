// Check every new object state and declared face against its material response.
const fs = require("node:fs");
const path = require("node:path");

/** @param {string} root @param {string} description */
function responseDefined(root, description) {
  const link = /\[[^\]]+\]\(([^)#]+)#([^)]+)\)/.exec(description);
  if (link) {
    const target = path.resolve(root, "docs/materials", link[1]);
    return fs.existsSync(target) && fs.readFileSync(target, "utf8").includes(`{#${link[2]}}`);
  }
  return /#[0-9a-fA-F]{6}\b/.test(description) && /roughness\s+\.?\d+/.test(description);
}

/** @param {string} root @param {Map<string,Map<string,Set<string>>>} models @param {string} materialText */
function objectSurfaceBindings(root, models, materialText) {
  const modelText = fs.readFileSync(
    path.join(root, "docs/models/005-everyday-objects.md"),
    "utf8",
  );
  const owners = [...modelText.matchAll(/^## .*\{#([^}]+)\}/gm)].map(
    (match) => match[1],
  );
  const requiredFaces = new Set();
  let activeOwner = "";
  for (const line of modelText.split(/\r?\n/)) {
    activeOwner = /^## .*\{#([^}]+)\}/.exec(line)?.[1] || activeOwner;
    const face = /^@material-face\s+([^:]+):\s*([^\s]+)$/.exec(line);
    if (face) requiredFaces.add(`${activeOwner}/${face[1].trim()}/${face[2]}`);
  }
  const errors = [],
    covered = new Set(),
    overrides = new Set();
  const finishDefinitions = new Map(), finishReferences = [];
  let bindings = 0,
    parts = 0;
  for (const line of materialText.split(/\r?\n/)) {
    const cells = line.startsWith("| ")
      ? line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
      : [];
    if (cells.length !== 7 || !owners.includes(cells[0])) continue;
    bindings++;
    const [owner, states, surface, finish, scale, uv, fallback] = cells;
    if (!finish || !uv || !fallback)
      errors.push(`${owner}: finish, UV, or fallback absent`);
    const finishMatch = /^([A-Za-z][A-Za-z0-9/-]*)(?::\s*(.+))?$/.exec(finish);
    if (!finishMatch) errors.push(`${owner}: malformed finish response ${finish}`);
    else if (!finishMatch[2]) finishReferences.push({ owner, id: finishMatch[1] });
    else {
      if (finishDefinitions.has(finishMatch[1])) errors.push(`${finishMatch[1]}: finish defined more than once`);
      finishDefinitions.set(finishMatch[1], finishMatch[2]);
      if (!responseDefined(root, finishMatch[2]))
        errors.push(`${finishMatch[1]}: response color/roughness or linked H2 absent`);
    }
    if (scale === "없음") {
      if (!/normal/.test(uv) || !/^solid/.test(fallback))
        errors.push(`${owner}: solid response policy absent`);
    } else {
      const linked = /^\[[^\]]+\]\(([^)#]+)#([^)]+)\)/.exec(scale);
      const target = linked && path.join(root, "docs/materials", linked[1]);
      const source =
        target && fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
      if (!linked || !source.includes(`{#${linked[2]}}`))
        errors.push(`${owner}: texture scale owner absent`);
      if (!/surface-metres/.test(uv) || !/Error/.test(fallback))
        errors.push(`${owner}: metric UV or fallback absent`);
    }
    const address = /^([^/]+)\/(\*|[^/]+)$/.exec(surface);
    if (!address) {
      errors.push(`${owner}: binding must name part/face`);
      continue;
    }
    const [, part, face] = address;
    for (const state of states.split(",").map((value) => value.trim())) {
      const ids = models.get(owner)?.get(state);
      if (!ids?.has(part)) {
        errors.push(
          `${owner}/${state}/${part}: binding references absent model part`,
        );
        continue;
      }
      const key = `${owner}/${state}/${part}`;
      const selected = face === "*" ? key : `${key}/${face}`;
      const target = face === "*" ? covered : overrides;
      if (target.has(selected))
        errors.push(`${selected}: duplicate surface binding`);
      target.add(selected);
      if (face !== "*" && !requiredFaces.has(selected))
        errors.push(`${selected}: face override has no model declaration`);
    }
  }
  for (const owner of owners) {
    const states = models.get(owner);
    if (!states) {
      errors.push(`${owner}: missing model inventory`);
      continue;
    }
    for (const [state, ids] of states)
      for (const part of ids) {
        parts++;
        if (!covered.has(`${owner}/${state}/${part}`))
          errors.push(`${owner}/${state}/${part}: material binding absent`);
      }
  }
  for (const face of requiredFaces)
    if (!overrides.has(face))
      errors.push(`${face}: declared material face has no finish binding`);
  for (const { owner, id } of finishReferences)
    if (!finishDefinitions.has(id)) errors.push(`${owner}: finish ${id} has no response definition`);
  return {
    states: owners.reduce(
      (count, owner) => count + (models.get(owner)?.size || 0),
      0,
    ),
    parts,
    bindings,
    finishDefinitions: finishDefinitions.size,
    finishReferences: finishReferences.length,
    errors,
  };
}

module.exports = { objectSurfaceBindings };
