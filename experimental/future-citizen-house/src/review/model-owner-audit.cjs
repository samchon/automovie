// Read-only measurement of the draft model inventory. Run from the production root.
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");
const { inventory } = require("./model-inventory.cjs");
const { objectSurfaceBindings } = require("./model-surface-bindings.cjs");

const root = path.resolve(__dirname, "../..");
const rooms = path.join(root, "src/house/rooms");
const accountPath = path.join(root, "docs/accounts/models/legacy-fitout.md");

function planRoomIds() {
  const source = fs.readFileSync(path.join(root, "src/house/plan.ts"), "utf8");
  const start = source.indexOf("export const rooms:");
  const end = source.indexOf("];", start);
  if (start < 0 || end < 0) throw Error("room plan population absent");
  const ids = [
    ...source.slice(start, end).matchAll(/^\s+id: "([^"]+)",\s*$/gm),
  ].map((match) => match[1]);
  if (!ids.length || new Set(ids).size !== ids.length)
    throw Error("room plan ids absent or duplicated");
  return ids;
}

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
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return cells.length < 3 || cells.at(-1) === "" || cells.at(-1) === "—";
  });
  return { rows, blank };
}

/** @param {string} account @param {string} [roomOverride] */
function audit(account, roomOverride) {
  const sources = fs
    .readdirSync(rooms)
    .filter((name) => name.endsWith(".ts") && name !== "interior.ts");
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

  const roots = ownedRows(
    section(account, "## Item root 대응", "## 직접 primitive와 방 lining"),
  );
  const direct = ownedRows(
    section(
      account,
      "## 직접 primitive와 방 lining",
      "## 공통 helper의 자식 면과 발광",
    ),
  );
  const demands = ownedRows(
    section(account, "## 상위·형제 층의 물품 요구 역대응", undefined),
  );
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

  const modelFiles = fs
    .readdirSync(path.join(root, "docs/models"))
    .filter((name) => /^\d{3}-.+\.md$/.test(name));
  /** @type {string[]} */
  const missingModelAnswers = [];
  let h2Count = 0;
  for (const file of modelFiles) {
    const value = fs.readFileSync(path.join(root, "docs/models", file), "utf8");
    const headings = [...value.matchAll(/^## (.+)$/gm)];
    h2Count += headings.length;
    for (let i = 0; i < headings.length; i++) {
      const body = value.slice(
        headings[i].index,
        headings[i + 1]?.index ?? value.length,
      );
      if (
        !/\{#[a-z0-9-]+\}/.test(headings[i][0]) ||
        !/ref0[1-5]/.test(body) ||
        !/unverified/.test(body)
      ) {
        missingModelAnswers.push(`${file}: ${headings[i][1]}`);
      }
    }
  }

  const errors = [];
  if (sites.item !== roots.rows.length)
    errors.push(`Item sites ${sites.item} != root rows ${roots.rows.length}`);
  if (sites.box + sites.ellipsoid !== direct.rows.length)
    errors.push(
      `primitive sites ${sites.box + sites.ellipsoid} != direct rows ${direct.rows.length}`,
    );
  for (const source of sources) {
    if (perSource[source] !== (accountedBySource[source] || 0))
      errors.push(
        `${source}: Item sites ${perSource[source]} != root rows ${accountedBySource[source] || 0}`,
      );
    if (directBySource[source] !== (accountedDirect[source] || 0))
      errors.push(
        `${source}: primitive sites ${directBySource[source]} != direct rows ${accountedDirect[source] || 0}`,
      );
  }
  for (const source of Object.keys(accountedBySource)) {
    if (!(source in perSource))
      errors.push(`${source}: account row has no room source`);
  }
  for (const source of Object.keys(accountedDirect)) {
    if (!(source in directBySource))
      errors.push(`${source}: direct row has no room source`);
  }
  if (sites.lining !== 12 || sites.lights !== 12)
    errors.push(`lining/lights sites ${sites.lining}/${sites.lights} != 12/12`);
  if (roots.blank.length || direct.blank.length || demands.blank.length)
    errors.push(
      `blank owner rows ${roots.blank.length + direct.blank.length + demands.blank.length}`,
    );
  errors.push(
    ...missingModelAnswers.map(
      (item) => `model H2 missing anchor/ref/unverified: ${item}`,
    ),
  );
  const roomSource =
    roomOverride ??
    fs.readFileSync(path.join(root, ".wiki/사물-목록.md"), "utf8");
  const models = inventory(root);
  const surfaces = objectSurfaceBindings(
    root,
    models,
    fs.readFileSync(
      path.join(root, "docs/materials/001-binding-and-scale.md"),
      "utf8",
    ),
  );
  errors.push(...surfaces.errors);
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
  let modelRooms = 0,
    modelKinds = 0,
    modelObjects = 0,
    coveredObjects = 0;
  const roomCounts = [];
  for (const line of roomSource.split(/\r?\n/)) {
    const row = /^\| ([^|]+) \| ([^|]+) \|/.exec(line);
    if (!row || !/×\d+/.test(row[2])) continue;
    modelRooms++;
    let roomCount = 0;
    for (const item of row[2].split(",")) {
      const match = /^\s*(.+?)×(\d+)\s*$/.exec(item);
      if (!match) {
        errors.push(`${row[1]}: malformed object ${item}`);
        continue;
      }
      const label = match[1].trim(),
        count = Number(match[2]);
      modelKinds++;
      modelObjects += count;
      roomCount += count;
      const binding = uses.get(label);
      if (!binding) {
        errors.push(`${row[1]}: ${label} has no model mapping`);
        continue;
      }
      used.add(label);
      const slash = binding.indexOf("/");
      const owner = binding.slice(0, slash),
        state = binding.slice(slash + 1);
      if (slash < 0 || !models.get(owner)?.has(state))
        errors.push(`${row[1]}: ${label} resolves to absent ${binding}`);
      else coveredObjects += count;
    }
    roomCounts.push(roomCount);
  }
  for (const label of uses.keys())
    if (!used.has(label)) errors.push(`${label}: mapping has no room object`);
  const listedRooms = [
    ...roomSource.matchAll(/^\| [^|\n]*`([^`]+)` \| [^|\n]*×\d+/gm),
  ].map((match) => match[1]);
  const plannedRooms = planRoomIds();
  for (const id of plannedRooms)
    if (!listedRooms.includes(id)) errors.push(`${id}: room has no object row`);
  for (const id of listedRooms)
    if (id !== "citizen-site" && !plannedRooms.includes(id))
      errors.push(`${id}: object row has no planned room`);
  const censusRows = [
    ...roomSource.matchAll(
      /^@census spaces=(\d+) objects=(\d+) covered=(\d+)$/gm,
    ),
  ];
  const census = censusRows[0];
  const declaredTotal =
    /^\| 합계 \| \*\*(\d+)\*\* \|[^\n]*\| \*\*(\d+)\*\* \|$/m.exec(roomSource);
  if (censusRows.length !== 1 || Number(census?.[1]) !== modelRooms)
    errors.push(`declared space count differs from ${modelRooms}`);
  if (Number(census?.[2]) !== modelObjects)
    errors.push(`declared object count differs from ${modelObjects}`);
  if (Number(census?.[3]) !== coveredObjects)
    errors.push(`declared covered count differs from ${coveredObjects}`);
  if (
    !declaredTotal ||
    Number(declaredTotal[1]) !== modelObjects ||
    Number(declaredTotal[2]) !== coveredObjects
  )
    errors.push(`total row differs from ${modelObjects}/${coveredObjects}`);
  const recapRows = [
    ...roomSource.matchAll(/^\| [^|]+ \| (\d+) \| [^|]+ \| (\d+) \|$/gm),
  ];
  if (recapRows.length !== roomCounts.length)
    errors.push(`recap rows ${recapRows.length} != rooms ${roomCounts.length}`);
  for (
    let index = 0;
    index < Math.min(recapRows.length, roomCounts.length);
    index++
  )
    if (
      Number(recapRows[index][1]) !== roomCounts[index] ||
      Number(recapRows[index][2]) !== roomCounts[index]
    )
      errors.push(
        `recap room ${index + 1} differs from object count ${roomCounts[index]}`,
      );
  return {
    sites,
    roots: roots.rows.length,
    direct: direct.rows.length,
    demands: demands.rows.length,
    h2Count,
    blankOwners:
      roots.blank.length + direct.blank.length + demands.blank.length,
    modelRooms,
    modelKinds,
    modelObjects,
    coveredObjects,
    objectSurfaceStates: surfaces.states,
    objectSurfaceParts: surfaces.parts,
    objectSurfaceBindings: surfaces.bindings,
    errors,
  };
}

const account = fs.readFileSync(accountPath, "utf8");
const result = audit(account);
const rootSection = section(
  account,
  "## Item root 대응",
  "## 직접 primitive와 방 lining",
);
const firstRow = dataRows(rootSection)[0];
const removed = account.replace(firstRow, "");
if (removed === account)
  throw Error("negative control owner row was not removed");
const negative = audit(removed);
if (negative.errors.length === 0)
  result.errors.push(
    "negative control did not fail after removing a root owner row",
  );
const roomSource = fs.readFileSync(
  path.join(root, ".wiki/사물-목록.md"),
  "utf8",
);
const census = /^@census spaces=(\d+) objects=(\d+) covered=(\d+)$/m.exec(
  roomSource,
);
const declaredTotal =
  /^\| 합계 \| \*\*(\d+)\*\* \|[^\n]*\| \*\*(\d+)\*\* \|$/m.exec(roomSource);
const recap = /^\| [^|]+ \| (\d+) \| [^|]+ \| (\d+) \|$/m.exec(roomSource);
if (!census || !declaredTotal || !recap)
  throw Error("room census declaration absent");
const countMutations = [
  [
    "spaces",
    roomSource.replace(
      census[0],
      census[0].replace(
        `spaces=${census[1]}`,
        `spaces=${Number(census[1]) + 1}`,
      ),
    ),
    "declared space count differs",
  ],
  [
    "N",
    roomSource.replace(
      census[0],
      census[0].replace(
        `objects=${census[2]}`,
        `objects=${Number(census[2]) + 1}`,
      ),
    ),
    "declared object count differs",
  ],
  [
    "M",
    roomSource.replace(
      census[0],
      census[0].replace(
        `covered=${census[3]}`,
        `covered=${Number(census[3]) + 1}`,
      ),
    ),
    "declared covered count differs",
  ],
  [
    "total",
    roomSource.replace(
      declaredTotal[0],
      declaredTotal[0].replace(
        `**${declaredTotal[1]}**`,
        `**${Number(declaredTotal[1]) + 1}**`,
      ),
    ),
    "total row differs",
  ],
  [
    "room",
    roomSource.replace(
      recap[0],
      recap[0].replace(`| ${recap[1]} |`, `| ${Number(recap[1]) + 1} |`),
    ),
    "recap room 1 differs",
  ],
  ["room removed", roomSource.replace(recap[0], ""), "recap rows"],
];
const countNegativeErrors = [];
for (const [label, changed, expected] of countMutations) {
  if (changed === roomSource)
    throw Error(`${label}: census mutation did not change source`);
  const findings = audit(account, changed).errors;
  if (!findings.some((error) => error.startsWith(expected)))
    result.errors.push(`${label}: census mutation remained green`);
  countNegativeErrors.push({ label, first: findings[0] || null });
}
const plannedRooms = planRoomIds();
const removedRoomId = plannedRooms[randomInt(plannedRooms.length)];
const roomDeleted = roomSource
  .split(/\r?\n/)
  .filter(
    (line) =>
      !(
        /^\| [^|\n]*`([^`]+)` \| [^|\n]*×\d+/.exec(line)?.[1] === removedRoomId
      ),
  )
  .join("\n");
const roomNegative = audit(account, roomDeleted);
if (
  !roomNegative.errors.some(
    (error) => error === `${removedRoomId}: room has no object row`,
  )
)
  result.errors.push("unselected room row deletion remained green");
const materialText = fs.readFileSync(
  path.join(root, "docs/materials/001-binding-and-scale.md"),
  "utf8",
);
const objectOwners = new Set(
  [
    ...fs
      .readFileSync(
        path.join(root, "docs/models/005-everyday-objects.md"),
        "utf8",
      )
      .matchAll(/^## .*\{#([^}]+)\}/gm),
  ].map((match) => match[1]),
);
const surfaceRows = materialText
  .split(/\r?\n/)
  .filter((line) => objectOwners.has(line.split("|")[1]?.trim()));
if (!surfaceRows.length)
  throw Error("empty object surface binding mutation population");
const selectedSurface = surfaceRows[randomInt(surfaceRows.length)];
const surfaceNegative = objectSurfaceBindings(
  root,
  inventory(root),
  materialText.replace(selectedSurface, ""),
);
if (!surfaceNegative.errors.length)
  result.errors.push("unselected surface binding deletion remained green");
const remainingFinishes = [...surfaceRows], finishMutations = [];
while (remainingFinishes.length && finishMutations.length < 10) {
  const selected = remainingFinishes.splice(randomInt(remainingFinishes.length), 1)[0];
  const cells = selected.split("|").slice(1, -1).map((cell) => cell.trim());
  cells[3] = `unresolved-finish-${finishMutations.length}`;
  const changed = materialText.replace(selected, `| ${cells.join(" | ")} |`);
  const findings = objectSurfaceBindings(root, inventory(root), changed).errors;
  finishMutations.push({ owner: cells[0], state: cells[1], red: findings.length > 0,
    first: findings[0] || null });
}
const finishRed = finishMutations.filter((entry) => entry.red).length;
if (finishRed !== finishMutations.length)
  result.errors.push(`unselected finish resolution mutations red ${finishRed}/${finishMutations.length}`);
console.log(
  JSON.stringify(
    {
      ...result,
      negativeControlErrors: negative.errors,
      countNegativeErrors,
      unselectedRoomMutation: {
        population: plannedRooms.length,
        room: removedRoomId,
        mutations: 1,
        red: roomNegative.errors.some(
          (error) => error === `${removedRoomId}: room has no object row`,
        )
          ? 1
          : 0,
      },
      unselectedSurfaceMutation: {
        population: surfaceRows.length,
        mutations: 1,
        red: surfaceNegative.errors.length ? 1 : 0,
        first: surfaceNegative.errors[0] || null,
      },
      unselectedFinishMutations: { population: surfaceRows.length,
        mutations: finishMutations.length, red: finishRed, results: finishMutations },
    },
    null,
    2,
  ),
);
if (result.errors.length) process.exitCode = 1;
