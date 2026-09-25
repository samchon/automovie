// Rebuild isolated source copies after perturbing the plan's spatial
// dimensions. Compare whole consumer families, not a selected element bound.
const { spawnSync } = require("node:child_process");
const { randomInt } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const project = path.resolve(__dirname, "../..");
const cache = path.resolve(project, "node_modules/.cache");
const source = path.join(project, "src");
const work = fs.mkdtempSync(path.join(cache, "space-derive-"));
if (!work.startsWith(cache + path.sep))
  throw new Error("Scratch path escaped cache");
const driver = `
const crypto = require("node:crypto");
const { builtEnvironmentElementBounds } = require("@automovie/engine");
const { buildHouse } = require("./src/house/build.ts");
const e = buildHouse();
const hash = (v) => crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
const groups = {};
for (const boundary of e.boundaries.filter((b) => b.kind === "exterior")) {
  const stem = boundary.id.replace(/-face$/, "-");
  const elements = e.elements.filter((x) => x.id.startsWith(stem) || boundary.elements.includes(x.id));
  const models = e.models.filter((m) => elements.some((x) => x.model === m.id));
  groups[boundary.id] = hash([boundary, e.openings.filter((o) => o.boundary === boundary.id), elements, models]);
  groups[boundary.id + "-frame"] = hash(builtEnvironmentElementBounds(e, boundary.id + "-body"));
  groups[boundary.id + "-openings"] = hash(e.openings.filter((o) => o.boundary === boundary.id));
}
for (const id of ["ground-storey", "upper-storey"]) groups[id] = hash(e.spaces.find((s) => s.id === id));
groups.rooms = hash(e.spaces.filter((s) => s.kind === "room"));
groups.stair = hash([e.connectors.find((c) => c.id === "single-stair"), e.elements.filter((x) => x.id.startsWith("stair-") || x.id.startsWith("landing-"))]);
groups.upperSlab = hash(e.elements.filter((x) => x.id.startsWith("upper-slab")));
groups.ceilings = hash([e.elements.filter((x) => x.id.startsWith("ceiling-")), e.models.filter((m) => m.id.startsWith("ceiling-mesh-"))]);
groups.partitions = hash(e.boundaries.filter((b) => b.kind === "partition"));
groups.approach = hash([e.elements.filter((x) => x.id.startsWith("approach-")), e.surfaces.filter((s) => s.surface.id === "entry-approach-landing")]);
const stringers = e.elements.filter((x) => /^stair-\\d-stringer-/.test(x.id));
const treads = e.elements.filter((x) => /-tread$/.test(x.id) && x.id.startsWith("stair-"));
let collisions = 0;
for (const stringer of stringers) for (const tread of treads) {
  const a = builtEnvironmentElementBounds(e, stringer.id), b = builtEnvironmentElementBounds(e, tread.id);
  if (a && b && ["x", "y", "z"].every((axis) => a.min[axis] < b.max[axis] - 1e-7 && b.min[axis] < a.max[axis] - 1e-7)) collisions++;
}
groups.stairPairs = String(stringers.length * treads.length);
groups.stairCollisions = String(collisions);
console.log(JSON.stringify(groups));
`;
/** @param {string} dir @param {RegExp} pattern */
const change = (dir, pattern) => {
  fs.cpSync(source, path.join(dir, "src"), { recursive: true });
  const file = path.join(dir, "src/house/plan.ts");
  const before = fs.readFileSync(file, "utf8");
  let matches = 0;
  const after = before.replace(pattern, (_full, prefix, value, suffix) => {
    matches++;
    return (
      prefix +
      (Number(value) + 0.04).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") +
      suffix
    );
  });
  if (matches !== 1)
    throw new Error(
      "Expected one plan scalar, found " + matches + " for " + pattern,
    );
  fs.writeFileSync(file, after);
};
/** @param {string} dir @returns {Record<string, string>} */
const run = (dir) => {
  fs.writeFileSync(path.join(dir, "driver.cjs"), driver);
  const result = spawnSync(process.execPath, ["-r", "tsx/cjs", "driver.cjs"], {
    cwd: dir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      (
        result.stderr ||
        result.stdout ||
        result.error?.message ||
        "Child process failed"
      ).slice(0, 1500),
    );
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1) || "{}");
};
const cases = [
  {
    name: "innerX",
    pattern: /(innerX:\s*)(-?\d+(?:\.\d+)?)(,)/,
    affected: [
      "rooms",
      "front-face-frame",
      "rear-face-frame",
      "front-face-openings",
      "rear-face-openings",
      "ceilings",
      "partitions",
    ],
  },
  {
    name: "innerZ",
    pattern: /(innerZ:\s*)(-?\d+(?:\.\d+)?)(,)/,
    affected: [
      "rooms",
      "left-face-frame",
      "right-face-frame",
      "left-face-openings",
      "right-face-openings",
      "ceilings",
      "partitions",
    ],
  },
  {
    name: "ground floor",
    pattern: /(floors:\s*\[\s*)(-?\d+(?:\.\d+)?)(\s*,)/,
    affected: [
      "rooms",
      "stair",
      "approach",
      "front-face-openings",
      "rear-face-openings",
      "left-face-openings",
      "right-face-openings",
    ],
  },
  {
    name: "upper floor",
    pattern: /(floors:\s*\[\s*-?\d+(?:\.\d+)?\s*,\s*)(-?\d+(?:\.\d+)?)(\s*\])/,
    affected: [
      "upper-storey",
      "rooms",
      "stair",
      "upperSlab",
      "partitions",
      "front-face-openings",
      "rear-face-openings",
      "left-face-openings",
      "right-face-openings",
    ],
  },
];
// Discover numeric room-cell edges actually consumed by an elevation. The
// sampled room and face come from this population, not a verdict's example.
const planText = fs.readFileSync(path.join(source, "house/plan.ts"), "utf8");
/** @type {Map<string, { text:string; start:number; end:number }[]>} */
const cellEdges = new Map();
for (const room of planText.matchAll(
  /\{\s*id:\s*"([^"]+)"[^}]*?cells:\s*\[\[([^\]]+)\]/g,
)) {
  const coordinates = room[2].split(",");
  const base = room.index + room[0].indexOf(room[2]);
  let position = 0;
  cellEdges.set(
    room[1],
    coordinates.map((part) => {
      const text = part.trim();
      const start = base + position + part.indexOf(text);
      position += part.length + 1;
      return { text, start, end: start + text.length };
    }),
  );
}
/** @type {{name:string;face:string;start:number;end:number;replacement:string}[]} */
const roomCases = [];
const seen = new Set();
for (const face of ["front", "rear", "left", "right"]) {
  const elevation = fs.readFileSync(
    path.join(source, "house/envelope", face + ".ts"),
    "utf8",
  );
  for (const call of elevation.matchAll(
    /roomEdge\("([^"]+)",\s*"([xz])",\s*"(min|max)"\)/g,
  )) {
    const coordinate = (call[2] === "x" ? 0 : 2) + (call[3] === "max" ? 1 : 0);
    const edge = cellEdges.get(call[1])?.[coordinate];
    const key = `${face}/${call[1]}/${coordinate}`;
    if (!edge || !/^-?datum\.inner(?:X|Z)$/.test(edge.text) || seen.has(key))
      continue;
    seen.add(key);
    roomCases.push({
      name: key,
      face,
      start: edge.start,
      end: edge.end,
      replacement: edge.text.startsWith("-")
        ? `${edge.text} + 0.04`
        : `${edge.text} - 0.04`,
    });
  }
}
let checked = 0,
  failures = 0,
  roomChecked = 0,
  roomMoved = 0;
try {
  const baseline = path.join(work, "baseline");
  fs.mkdirSync(baseline);
  fs.cpSync(source, path.join(baseline, "src"), { recursive: true });
  const original = run(baseline);
  if (Number(original.stairCollisions) !== 0) {
    failures++;
    console.error(
      `stair stringer/tread collisions: ${original.stairCollisions}`,
    );
  }
  for (const scenario of cases) {
    const dir = path.join(work, scenario.name.replace(/\W+/g, "-"));
    fs.mkdirSync(dir);
    change(dir, scenario.pattern);
    let mutant;
    try {
      mutant = run(dir);
    } catch (error) {
      failures += scenario.affected.length;
      checked += scenario.affected.length;
      console.error(
        `THREW ${scenario.name}; ${scenario.affected.length} families unmeasured: ${error}`,
      );
      continue;
    }
    for (const family of scenario.affected) {
      checked++;
      if (original[family] === mutant[family]) {
        failures++;
        console.error(`UNMOVED ${scenario.name} -> ${family}`);
      }
    }
  }
  const pool = [...roomCases];
  while (pool.length) {
    const [scenario] = pool.splice(randomInt(pool.length), 1);
    const dir = path.join(work, `room-${roomChecked}`);
    fs.mkdirSync(dir);
    fs.cpSync(source, path.join(dir, "src"), { recursive: true });
    const file = path.join(dir, "src/house/plan.ts");
    const before = fs.readFileSync(file, "utf8");
    fs.writeFileSync(
      file,
      before.slice(0, scenario.start) +
        scenario.replacement +
        before.slice(scenario.end),
    );
    roomChecked++;
    try {
      const mutant = run(dir);
      if (
        original[scenario.face + "-face-openings"] !==
        mutant[scenario.face + "-face-openings"]
      )
        roomMoved++;
      else {
        failures++;
        console.error(`UNMOVED room cell ${scenario.name}`);
      }
    } catch (error) {
      failures++;
      console.error(`THREW room cell ${scenario.name}: ${error}`);
    }
  }
  console.log(
    `space-derive-audit: ${cases.length} plan scalars, ${checked} consumer families, ${roomCases.length} eligible room edges, ${roomChecked} random room mutations, ${roomMoved} moved, ${original.stairPairs} stringer/tread pairs, ${failures} failures`,
  );
  if (!roomChecked || failures) process.exitCode = 1;
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
