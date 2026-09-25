// Read-only measurement of the draft model inventory. Run from the production root.
const fs = require("node:fs");
const path = require("node:path");
const { inventory } = require("./model-inventory.cjs");

const root = path.resolve(__dirname, "../..");
const rooms = path.join(root, "src/house/rooms");
const accountPath = path.join(root, "docs/accounts/models/legacy-fitout.md");

/** @param {string} value @param {RegExp} pattern */
function count(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

/** @param {string} value @param {string} start @param {string | undefined} end */
function section(value, start, end) {
  const from = value.indexOf(start);
  if (from < 0) throw Error(`missing section ${start}`);
  const finish = end ? value.indexOf(end, from + start.length) : value.length;
  if (finish < 0) throw Error(`missing section ${end}`);
  return value.slice(from, finish);
}

/** @param {string} value */
function dataRows(value) {
  return value.split(/\r?\n/).filter((line) => {
    if (!/^\| [^\-|]/.test(line)) return false;
    const first = line.split("|")[1].trim();
    return !/^Source(?:\s|$)|^요구와 목적지$/.test(first);
  });
}

/** @param {string} value */
function ownedRows(value) {
  const rows = dataRows(value);
  const blank = rows.filter((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    return cells.length < 3 || cells.at(-1) === "" || cells.at(-1) === "—";
  });
  return { rows, blank };
}

/** @param {string} account */
function audit(account) {
  const sources = fs.readdirSync(rooms).filter((name) => name.endsWith(".ts") && name !== "interior.ts");
  /** @type {Record<string, number>} */
  const sites = { item: 0, box: 0, ellipsoid: 0, lining: 0, lights: 0 };
  /** @type {Record<string, number>} */
  const perSource = {};
  /** @type {Record<string, number>} */
  const directBySource = {};
  for (const source of sources) {
    const value = fs.readFileSync(path.join(rooms, source), "utf8");
    const items = count(value, /\bnew\s+Item\s*\(/g);
    perSource[source] = items;
    sites.item += items;
    const boxes = count(value, /\ba\.box\s*\(/g);
    const ellipsoids = count(value, /\ba\.ellipsoid\s*\(/g);
    directBySource[source] = boxes + ellipsoids;
    sites.box += boxes;
    sites.ellipsoid += ellipsoids;
    sites.lining += count(value, /\blining\s*\(/g);
    sites.lights += count(value, /\blights\s*\(/g);
  }

  const roots = ownedRows(section(account, "## Item root 대응", "## 직접 primitive와 방 lining"));
  const direct = ownedRows(section(account, "## 직접 primitive와 방 lining", "## 공통 helper의 자식 면과 발광"));
  const demands = ownedRows(section(account, "## 상위·형제 층의 물품 요구 역대응", undefined));
  /** @type {Record<string, number>} */
  const accountedBySource = {};
  /** @type {Record<string, number>} */
  const accountedDirect = {};
  for (const row of roots.rows) {
    const source = row.split("|")[1].trim();
    accountedBySource[source] = (accountedBySource[source] || 0) + 1;
  }
  for (const row of direct.rows) {
    const source = row.split("|")[1].trim().split(" ")[0];
    accountedDirect[source] = (accountedDirect[source] || 0) + 1;
  }

  const modelFiles = fs.readdirSync(path.join(root, "docs/models")).filter((name) => /^\d{3}-.+\.md$/.test(name));
  /** @type {string[]} */
  const missingModelAnswers = [];
  let h2Count = 0;
  for (const file of modelFiles) {
    const value = fs.readFileSync(path.join(root, "docs/models", file), "utf8");
    const headings = [...value.matchAll(/^## (.+)$/gm)];
    h2Count += headings.length;
    for (let i = 0; i < headings.length; i++) {
      const body = value.slice(headings[i].index, headings[i + 1]?.index ?? value.length);
      if (!/\{#[a-z0-9-]+\}/.test(headings[i][0]) || !/ref0[1-5]/.test(body) || !/unverified/.test(body)) {
        missingModelAnswers.push(`${file}: ${headings[i][1]}`);
      }
    }
  }

  const errors = [];
  if (sites.item !== roots.rows.length) errors.push(`Item sites ${sites.item} != root rows ${roots.rows.length}`);
  if (sites.box + sites.ellipsoid !== direct.rows.length) errors.push(`primitive sites ${sites.box + sites.ellipsoid} != direct rows ${direct.rows.length}`);
  for (const source of sources) {
    if (perSource[source] !== (accountedBySource[source] || 0)) errors.push(`${source}: Item sites ${perSource[source]} != root rows ${accountedBySource[source] || 0}`);
    if (directBySource[source] !== (accountedDirect[source] || 0)) errors.push(`${source}: primitive sites ${directBySource[source]} != direct rows ${accountedDirect[source] || 0}`);
  }
  for (const source of Object.keys(accountedBySource)) {
    if (!(source in perSource)) errors.push(`${source}: account row has no room source`);
  }
  for (const source of Object.keys(accountedDirect)) {
    if (!(source in directBySource)) errors.push(`${source}: direct row has no room source`);
  }
  if (sites.lining !== 12 || sites.lights !== 12) errors.push(`lining/lights sites ${sites.lining}/${sites.lights} != 12/12`);
  if (roots.blank.length || direct.blank.length || demands.blank.length) errors.push(`blank owner rows ${roots.blank.length + direct.blank.length + demands.blank.length}`);
  errors.push(...missingModelAnswers.map((item) => `model H2 missing anchor/ref/unverified: ${item}`));
  const roomSource = fs.readFileSync(path.join(root, ".wiki/사물-목록.md"), "utf8");
  const models = inventory(root);
  /** @type {Map<string,string>} */ const uses = new Map();
  for (const line of roomSource.split(/\r?\n/)) {
    const match = /^@uses\s+([^:]+):\s*([^\s]+)$/.exec(line);
    if (!match) continue;
    for (const label of match[1].split(",").map((value) => value.trim())) {
      if (uses.has(label)) errors.push(`${label}: duplicate model mapping`);
      uses.set(label, match[2]);
    }
  }
  const used = new Set();
  let modelRooms = 0, modelKinds = 0, modelObjects = 0, coveredObjects = 0;
  for (const line of roomSource.split(/\r?\n/)) {
    const row = /^\| ([^|]+) \| ([^|]+) \|/.exec(line);
    if (!row || !/×\d+/.test(row[2])) continue;
    modelRooms++;
    for (const item of row[2].split(",")) {
      const match = /^\s*(.+?)×(\d+)\s*$/.exec(item);
      if (!match) { errors.push(`${row[1]}: malformed object ${item}`); continue; }
      const label = match[1].trim(), count = Number(match[2]);
      modelKinds++;
      modelObjects += count;
      const binding = uses.get(label);
      if (!binding) { errors.push(`${row[1]}: ${label} has no model mapping`); continue; }
      used.add(label);
      const slash = binding.indexOf("/");
      const owner = binding.slice(0, slash), state = binding.slice(slash + 1);
      if (slash < 0 || !models.get(owner)?.has(state))
        errors.push(`${row[1]}: ${label} resolves to absent ${binding}`);
      else coveredObjects += count;
    }
  }
  for (const label of uses.keys()) if (!used.has(label)) errors.push(`${label}: mapping has no room object`);
  return { sites, roots: roots.rows.length, direct: direct.rows.length, demands: demands.rows.length,
    h2Count, blankOwners: roots.blank.length + direct.blank.length + demands.blank.length,
    modelRooms, modelKinds, modelObjects, coveredObjects, errors };
}

const account = fs.readFileSync(accountPath, "utf8");
const result = audit(account);
const rootSection = section(account, "## Item root 대응", "## 직접 primitive와 방 lining");
const firstRow = dataRows(rootSection)[0];
const removed = account.replace(firstRow, "");
if (removed === account) throw Error("negative control owner row was not removed");
const negative = audit(removed);
if (negative.errors.length === 0) result.errors.push("negative control did not fail after removing a root owner row");
console.log(JSON.stringify({ ...result, negativeControlErrors: negative.errors }, null, 2));
if (result.errors.length) process.exitCode = 1;
