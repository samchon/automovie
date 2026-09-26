/** Crosses every interior-door casing against the authored room reservations
 * and partition solids. Door positions and reservation bounds come from the
 * spaces sources on every run; only the shared casing section supplies the
 * model dimensions. A reservation collision requires an explicit subtractive
 * volume in the corresponding model prose. This measures a design interface,
 * not an unbuilt model mesh. */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const roomPath = path.join(root, "src/spaces/rooms");
const rooms = fs.readdirSync(roomPath).filter((f) => f.endsWith(".ts"));
const sources = rooms.map((file) => ({
  file,
  text: fs.readFileSync(path.join(roomPath, file), "utf8"),
}));
const modelSource = fs.readFileSync(
  path.join(root, "docs/models/03-interior-doors.md"),
  "utf8",
);
const modelBody = modelSource.split(/^## /m).find((s) =>
  s.split("\n", 1)[0].includes("{#interior-door-members}"),
);
if (!modelBody) throw new Error("Missing interior door design H2");
const authoredCasingWidth = Number(
  /문선.*?폭 (0\.\d+) m 띠/.exec(modelBody)?.[1],
);
const casingWidth = process.argv.includes("--mutate-widen-casing")
  ? authoredCasingWidth + 0.03
  : authoredCasingWidth;
const projection = Number(/벽면에서 (0\.\d+) m 돌출/.exec(modelBody)?.[1]);
const verticalLine = modelBody.split(/\r?\n/).find((line) => line.includes("`casing-a`·`casing-b` 좌우 세로 판")) ?? "";
const vertical = [...verticalLine.matchAll(/Y=\[([^\]]+)\]/g)].map((m) =>
  m[1].split(",").map(Number),
);
const [[casingBottom, casingShoulder] = [], [headBase, headTop] = []] = vertical;
if (![casingWidth, projection, casingBottom, casingShoulder, headBase, headTop].every(
  Number.isFinite,
))
  throw new Error("Casing dimensions are not parseable");
// Read the executed spaces values. Text matching cannot follow imported voids,
// derived floor datums or formatting changes in the source files.
require(require.resolve("tsx/cjs"));
const { buildHouse } = require("../spaces/house.ts");
const { floorOf } = require("../spaces/storeys.ts");
const house = buildHouse();
/** @typedef {readonly [number, number]} Span */
/** @param {string} s @returns {Span} */
const pair = (s) => {
  const parts = s.split(",").map((v) =>
    Number(v.trim().replace(/\u2212/g, "-")),
  );
  if (parts.length !== 2 || !parts.every(Number.isFinite)) throw new Error(
    `Invalid interval ${s}`,
  );
  return /** @type {Span} */ (/** @type {unknown} */ (parts));
};
/** @param {Span} a @param {Span} b */
const overlap = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
/** @param {Span} a @param {Span} b */
const subset = (a, b) => a[0] >= b[0] - 1e-8 && a[1] <= b[1] + 1e-8;
/** @param {number} v */
const isPositive = (v) => v > 1e-8;
/** @typedef {{ id:string;kind:string;file:string;x:Span;z:Span;y:Span|null }} Reservation */
/** @typedef {{ id:string;file:string;axis:string;across:Span;along:Span;floor:number }} Wall */
/** @type {Reservation[]} */
const boxes = house.spaces.flatMap((room) =>
  (room.reservations ?? []).map((box) => ({
    id: box.id,
    kind: box.kind,
    file: path.basename(room.owner),
    x: box.x,
    z: box.z,
    y: box.y ?? null,
  })),
);
/** @type {Wall[]} */
const partitions = [];
/** @type {{ id:string;wall:Wall;from:number;to:number }[]} */
const doors = [];
for (const part of house.parts) {
  if (!part.wall || !(part.role === "partition" || part.id === "garage-shared-wall")) continue;
  const room = house.spaces.find((space) => space.owner === part.owner);
  const wall = {
    id: part.id, file: path.basename(part.owner), axis: part.wall.axis,
    across: part.wall.across,
    along: /** @type {Span} */ ([Math.min(...part.wall.outline.map((v) => v.u)), Math.max(...part.wall.outline.map((v) => v.u))]),
    floor: room ? (room.levels?.[0] ?? floorOf(room.storey)) : floorOf("ground-storey"),
  };
  partitions.push(wall);
  for (const hole of part.wall.holes) if (hole.id.endsWith("-door"))
    doors.push({ id: hole.id, wall, from: hole.from, to: hole.to });
}
if (doors.length !== 11) throw new Error(
  `Expected eleven authored interior doors; found ${doors.length}: ${doors.map((d) => d.id).join(", ")}`,
);
if (process.argv.includes("--inventory")) console.log(JSON.stringify({ doors }, null, 2));

/** A reservation is an allowed host envelope. An actual casing may overlap
 * that envelope only where the host document explicitly subtracts the overlap. */
const modelFiles = fs.readdirSync(path.join(root, "docs/models")).filter((f) =>
  f.endsWith(".md"),
);
const subtractionLines = modelFiles.flatMap((file) => fs.readFileSync(path.join(root, "docs/models", file), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)
  .filter((line) => /빼|비운|절개|파낸/.test(line))
  .map((line) => ({ file, line })));
/** @param {string} line @param {string} axis @returns {Span[]} */
const range = (line, axis) => {
  const numeric = /^\s*[−-]?\d+(?:\.\d+)?\s*,\s*[−-]?\d+(?:\.\d+)?\s*$/;
  return [...line.matchAll(new RegExp(`${axis}=\\[([^\\]]+)\\]`, "g"))]
    .filter((m) => numeric.test(m[1]))
    .map((m) => pair(m[1]));
};
/** @param {{ x:Span;z:Span;y:Span }} hit */
const hasSubtraction = (hit) => subtractionLines.some(({ line }) => {
  const xs = range(line, "X"), zs = range(line, "Z"), ys = range(line, "Y");
  return xs.some((x) => subset(hit.x, x)) && zs.some((z) => subset(hit.z, z)) &&
    (!hit.y || ys.some((y) => subset(hit.y, y)) || /판 두께 전체|다섯 판|다섯 단/.test(line));
});
const casingOverrides = modelBody.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)
  .filter((line) => line.includes("`casing-") && /[a-z-]+-door/.test(line))
  .flatMap((line) => {
    const id = /([a-z-]+-door)/.exec(line)?.[1];
    const xs = range(line, "X"), zs = range(line, "Z");
    return id && xs.length && zs.length ? [{ id, x: xs[0], z: zs[0] }] : [];
  });
const failures = [];
if (Math.abs(casingBottom) > 1e-8) failures.push(
  `Casing feet float above or penetrate the room floor by ${casingBottom} m`,
);
if (Math.abs(casingShoulder - headBase) > 1e-8) failures.push(
  "Casing head and vertical boards do not meet by face",
);
let reservationIntersections = 0;
let partitionIntersections = 0;
for (const door of doors) {
  const { axis, across, floor } = door.wall;
  const [from, to] = [door.from, door.to];
  /** @type {Span[]} */
  const faces = [
    [across[0] - projection, across[0]],
    [across[1], across[1] + projection],
  ];
  /** @type {[number,number,number,number][]} */
  const strips = [
    [from - casingWidth, from, casingBottom, casingShoulder],
    [to, to + casingWidth, casingBottom, casingShoulder],
    [from - casingWidth, to + casingWidth, headBase, headTop],
  ];
  for (const dep of faces) for (const [a, b, low, high] of strips) {
    /** @type {Span} */
    let x = axis === "z" ? dep : [a, b];
    /** @type {Span} */
    let z = axis === "z" ? [a, b] : dep;
    // A particular door may narrow one casing board at a neighbouring wall.
    // The override is accepted only if both measured spans lie within this
    // ordinary board; it cannot erase an unrelated collision.
    const override = casingOverrides.find((v) => v.id === door.id && subset(v.x, x) && subset(v.z, z) &&
      (overlap(v.x, x) < x[1] - x[0] - 1e-8 || overlap(v.z, z) < z[1] - z[0] - 1e-8));
    if (override) {
      x = override.x;
      z = override.z; }
    const y = [floor + low, floor + high];
    for (const p of partitions) {
      if (p.floor !== floor || p.id === door.wall.id) continue;
      const wx = p.axis === "z" ? p.across : p.along;
      const wz = p.axis === "z" ? p.along : p.across;
      if (isPositive(overlap(x, wx)) && isPositive(overlap(z, wz))) {
        partitionIntersections++;
        failures.push(
          `${door.id} casing intersects ${p.file}:${p.id} x=${x} z=${z}`,
        );
      }
    }
    for (const box of boxes) {
      if (!box.y || box.kind === "swing" || box.kind === "use" || box.kind === "route") continue;
      // Reservation boxes in src/spaces already store world Y on both floors.
      const by = box.y;
      /** @type {{ x:Span;z:Span;y:Span }} */
      const hit = {
        x: [Math.max(x[0], box.x[0]), Math.min(x[1], box.x[1])],
        z: [Math.max(z[0], box.z[0]), Math.min(z[1], box.z[1])],
        y: [Math.max(y[0], by[0]), Math.min(y[1], by[1])],
      };
      if (![hit.x, hit.z, hit.y].every((v) =>
        isPositive(v[1] - v[0]),
      )) continue;
      reservationIntersections++;
      if (!hasSubtraction(hit)) failures.push(
        `${door.id} casing intersects ${box.file}:${box.id} without model subtraction x=${hit.x} z=${hit.z} y=${hit.y}`,
      );
    }
  }
}
const hinges = modelSource.split(/^## /m).find((s) => s.split("\n", 1)[0].includes("{#interior-door-hinges}")) ?? "";
const hingeRows = [...hinges.matchAll(/^\| `([^\x60]+-door)` \| (low|high) ([XZ]) \| ([+−-])([XZ]) \| (\d+(?:\.\d+)?) \| \[[^\]]+\]\(\.\.\/spaces\/rooms\/([^#)]+)#[^)]+\) \|/gm)]
  .map((m) => ({ id: m[1], end: m[2], alongAxis: m[3].toLowerCase(), sign: m[4] === "+" ? 1 : -1,
    openAxis: m[5].toLowerCase(), handle: Number(m[6]), roomFile: m[7].replace(/\.md$/, ".ts") }));
if (hingeRows.length !== doors.length || new Set(hingeRows.map((v) => v.id)).size !== doors.length)
  failures.push(
    `Door hinge table has ${hingeRows.length} rows for ${doors.length} distinct source doors`,
  );
const jambInset = Number(
  /문설주의 개구부 쪽 면 폭을\s*(0\.\d+) m/.exec(modelBody)?.[1],
);
const leafThickness = Number(/문짝 두께를\s*(0\.\d+) m/.exec(modelBody)?.[1]);
if (![jambInset, leafThickness].every(Number.isFinite)) throw new Error("Cannot read shared door jamb and leaf thickness");
/** @type {{ id:string;x:Span;z:Span;routeHits:string[];obstructionHits:string[] }[]} */
const openLeaves = [];
/** @param {Span} x @param {Span} z @param {string} source */
function insideRoom(x, z, source) {
  const boxMatch = /outline:\s*box\(\[([^\]]+)\],\s*\[([^\]]+)\]\)/.exec(
    source,
  );
  if (boxMatch) return subset(x, pair(boxMatch[1])) && subset(z, pair(boxMatch[2]));
  const poly = /outline:\s*\[([\s\S]*?)\],\s*floor:/.exec(source)?.[1];
  if (!poly) return false;
  const points = [...poly.matchAll(/\{\s*x:\s*(-?\d+(?:\.\d+)?),\s*z:\s*(-?\d+(?:\.\d+)?)\s*\}/g)]
    .map((m) => [Number(m[1]), Number(m[2])]);
  if (points.length < 3) return false;
  const xs = [...new Set([x[0], x[1], ...points.map((p) => p[0]).filter((v) => v > x[0] && v < x[1])])].sort(
    (a, b) => a - b,
  );
  const zs = [...new Set([z[0], z[1], ...points.map((p) => p[1]).filter((v) => v > z[0] && v < z[1])])].sort(
    (a, b) => a - b,
  );
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const px = (xs[i] + xs[i + 1]) / 2, pz = (zs[j] + zs[j + 1]) / 2;
    let inside = false;
    for (let k = 0, l = points.length - 1; k < points.length; l = k++) {
      const a = points[k], b = points[l];
      if ((a[1] > pz) !== (b[1] > pz) && px < a[0] + (pz - a[1]) * (b[0] - a[0]) / (b[1] - a[1])) inside = !inside;
    }
    if (!inside) return false;
  }
  return true;
}
for (const door of doors) {
  const row = hingeRows.find((v) => v.id === door.id);
  if (!row) {
    failures.push(`No hinge decision for ${door.id}`);
    continue;
  }
  const alongAxis = door.wall.axis === "z" ? "z" : "x";
  const openAxis = alongAxis === "z" ? "x" : "z";
  if (row.alongAxis !== alongAxis || row.openAxis !== openAxis)
    failures.push(`${door.id} hinge/open axes contradict its source wall`);
  const pivot = row.end === "low" ? door.from + jambInset : door.to - jambInset;
  const leafWidth = door.to - door.from - 2 * jambInset;
  const face = row.sign > 0 ? door.wall.across[1] : door.wall.across[0];
  const open = row.sign > 0
    ? [face, face + leafWidth]
    : [face - leafWidth, face];
  const side = row.end === "low"
    ? [pivot - row.handle, pivot + leafThickness]
    : [pivot - leafThickness, pivot + row.handle];
  const x = /** @type {Span} */ (/** @type {unknown} */ (openAxis === "x"
    ? open
    : side));
  const z = /** @type {Span} */ (/** @type {unknown} */ (openAxis === "z"
    ? open
    : side));
  const roomText = sources.find((source) => source.file === row.roomFile)?.text;
  if (!roomText) failures.push(
    `${door.id}: no measured room source at ${row.roomFile}`,
  );
  else if (!insideRoom(x, z, roomText))
    failures.push(
      `${door.id}: open leaf outside its reviewed room outline x=${x} z=${z}`,
    );
  const routeHits = boxes.filter((b) => b.kind === "route" && b.file === row.roomFile &&
    isPositive(overlap(x, b.x)) && isPositive(overlap(z, b.z))).map((b) => b.id);
  if (routeHits.length) failures.push(
    `${door.id}: open leaf intersects routes ${routeHits.join(",")}`,
  );
  const obstructionHits = boxes.filter((b) => ["furniture", "fixture", "storage"].includes(b.kind) &&
    b.file === row.roomFile && b.y && isPositive(overlap(x, b.x)) && isPositive(overlap(z, b.z)) &&
    isPositive(overlap([door.wall.floor, door.wall.floor + 2.16], b.y))).map((b) => b.id);
  if (obstructionHits.length) failures.push(
    `${door.id}: open leaf intersects reserved objects ${obstructionHits.join(",")}`,
  );
  openLeaves.push({ id: door.id, x, z, routeHits, obstructionHits });
}
console.log(
  JSON.stringify({
    doors: doors.length,
    partitions: partitions.length,
    reservationBoxes: boxes.length,
    reservationIntersections,
    partitionIntersections,
    hingeRows: hingeRows.length,
    measuredOpenLeaves: openLeaves.length,
    openLeafRouteHits: openLeaves.reduce(
      (n, leaf) => n + leaf.routeHits.length,
      0,
    ),
    openLeafObstructionHits: openLeaves.reduce(
      (n, leaf) => n + leaf.obstructionHits.length,
      0,
    ),
    openLeaves: process.argv.includes("--inventory") ? openLeaves : undefined,
    failures,
  }),
);
if (failures.length) process.exitCode = 1;
