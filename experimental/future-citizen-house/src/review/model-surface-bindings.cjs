// Check every new object state and declared face against its material response.
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");

/** @param {string} root @param {string} description */
function responseDefined(root, description) {
  const link = /\[[^\]]+\]\(([^)#]+)#([^)]+)\)/.exec(description);
  if (link) {
    const target = path.resolve(root, "docs/materials", link[1]);
    return fs.existsSync(target) && fs.readFileSync(target, "utf8").includes(`{#${link[2]}}`);
  }
  if (!/#[0-9a-fA-F]{6}\b/.test(description) || !/\broughness\s+\.?\d+/.test(description))
    return false;
  for (const match of description.matchAll(/\b(roughness|metallic|transmission|clearcoat)\s+([+-]?(?:\d+\.?\d*|\.\d+))/g)) {
    const value = Number(match[2]);
    if (!(value >= 0 && value <= 1)) return false;
  }
  for (const match of description.matchAll(/\b(ior|thickness)\s+([+-]?(?:\d+\.?\d*|\.\d+))/g)) {
    const value = Number(match[2]);
    if (!(match[1] === "ior" ? value > 1 : value > 0)) return false;
  }
  return true;
}

/** @param {string} root @param {Map<string,Map<string,Set<string>>>} models @param {string} materialText @param {string} [modelOverride] */
function objectSurfaceBindings(root, models, materialText, modelOverride) {
  const modelText = modelOverride ?? fs.readFileSync(
    path.join(root, "docs/models/005-everyday-objects.md"),
    "utf8",
  );
  const owners = [...modelText.matchAll(/^## .*\{#([^}]+)\}/gm)].map(
    (match) => match[1],
  );
  const requiredFaces = new Set();
  const proseFaces = new Set();
  const proseKeyByFace = new Map();
  const duplicateFaces = [];
  let activeOwner = "";
  for (const line of modelText.split(/\r?\n/)) {
    activeOwner = /^## .*\{#([^}]+)\}/.exec(line)?.[1] || activeOwner;
    const face = /^@material-face\s+([^:]+):\s*([^\s]+)$/.exec(line);
    if (face) {
      const address = `${activeOwner}/${face[1].trim()}/${face[2]}`;
      if (requiredFaces.has(address)) duplicateFaces.push(address);
      requiredFaces.add(address);
      proseKeyByFace.set(address, `${activeOwner}/${face[2]}`);
    }
    if (!activeOwner || /^@|^\||^<!--/.test(line)) continue;
    for (const match of line.matchAll(/`([a-z][a-z0-9.\-/]+)`/g)) {
      const segments = match[1].split("/");
      if (segments.length < 2) continue;
      for (const namedFace of segments.slice(1))
        proseFaces.add(`${activeOwner}/${segments[0]}/${namedFace}`);
    }
  }
  const errors = [],
    covered = new Set(),
    overrides = new Set();
  for (const face of duplicateFaces) errors.push(`${face}: duplicate model face declaration`);
  const finishDefinitions = new Map(), finishReferences = [];
  let bindings = 0,
    parts = 0, faceBindingOwners = 0;
  for (const line of materialText.split(/\r?\n/)) {
    const cells = line.startsWith("| ")
      ? line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
      : [];
    if (cells.length !== 8 || !owners.includes(cells[0])) continue;
    bindings++;
    const [owner, states, surface, finish, scale, uv, fallback, host] = cells;
    const hostLink = /^\[host\]\(([^)#]+)#([^)]+)\)$/.exec(host);
    if (!hostLink || hostLink[2] !== owner ||
      path.resolve(root, "docs/materials", hostLink[1]) !==
        path.resolve(root, "docs/models/005-everyday-objects.md"))
      errors.push(`${owner}: face binding model H2 owner absent`);
    else faceBindingOwners++;
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
  for (const face of requiredFaces)
    if (!proseFaces.has(proseKeyByFace.get(face)))
      errors.push(`${face}: declared material face absent from model prose address`);
  for (const { owner, id } of finishReferences)
    if (!finishDefinitions.has(id)) errors.push(`${owner}: finish ${id} has no response definition`);
  return {
    states: owners.reduce(
      (count, owner) => count + (models.get(owner)?.size || 0),
      0,
    ),
    parts,
    bindings,
    faceBindingOwners,
    faceDeclarations: requiredFaces.size,
    provedFaceDeclarations: [...requiredFaces].filter((face) => overrides.has(face) &&
      proseFaces.has(proseKeyByFace.get(face))).length,
    finishDefinitions: finishDefinitions.size,
    finishReferences: finishReferences.length,
    errors,
  };
}

/** @param {string} root @param {Map<string,Map<string,Set<string>>>} models @param {string} materialText @param {string[]} surfaceRows */
function sampleResponseMutation(root, models, materialText, surfaceRows) {
  const candidates = surfaceRows.filter((line) => /\broughness\s+\.?\d+/.test(line));
  if (!candidates.length) throw Error("empty physical finish response mutation population");
  const selected = candidates[randomInt(candidates.length)];
  const changed = selected.replace(/\broughness\s+\.?\d+/, "roughness 1.5");
  if (changed === selected) throw Error("selected finish response unchanged");
  const findings = objectSurfaceBindings(root, models, materialText.replace(selected, changed)).errors;
  const first = findings.find((error) => error.includes("response color/roughness or linked H2 absent")) || null;
  return { population: candidates.length, mutations: 1, red: first ? 1 : 0, first };
}

module.exports = { objectSurfaceBindings, sampleResponseMutation };
