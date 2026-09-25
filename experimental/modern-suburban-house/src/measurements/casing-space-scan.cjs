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
const sources = rooms.map((file) => ({ file, text: fs.readFileSync(path.join(roomPath, file), "utf8") }));
const modelSource = fs.readFileSync(path.join(root, "docs/models/03-interior-doors.md"), "utf8");
const modelBody = modelSource.split(/^## /m).find((s) => s.split("\n", 1)[0].includes("{#interior-door-members}"));
if (!modelBody) throw new Error("Missing interior door design H2");
const authoredCasingWidth = Number(/문선.*?폭 (0\.\d+) m 띠/.exec(modelBody)?.[1]);
const casingWidth = process.argv.includes("--mutate-widen-casing") ? authoredCasingWidth + 0.03 : authoredCasingWidth;
const projection = Number(/벽면에서 (0\.\d+) m 돌출/.exec(modelBody)?.[1]);
const headTop = Number(/머리 판은[^\n]*Y=\[2\.20,(\d+\.\d+)\]/.exec(modelBody)?.[1]);
if (![casingWidth, projection, headTop].every(Number.isFinite)) throw new Error("Casing dimensions are not parseable");
const floorSource = fs.readFileSync(path.join(root, "src/spaces/storeys.ts"), "utf8");
const upperFloor = Number(/upperFloor:\s*(\d+(?:\.\d+)?)/.exec(floorSource)?.[1]);
if (!Number.isFinite(upperFloor)) throw new Error("Upper storey datum is not parseable");
/** @typedef {[number, number]} Span */
/** @param {string} s @returns {Span} */
const pair = (s) => {
  const parts = s.split(",").map((v) => Number(v.trim().replace("−", "-")));
  if (parts.length !== 2 || !parts.every(Number.isFinite)) throw new Error(`Invalid interval ${s}`);
  return /** @type {Span} */ (parts);
};
/** @param {Span} a @param {Span} b */
const overlap = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
/** @param {Span} a @param {Span} b */
const subset = (a, b) => a[0] >= b[0] - 1e-8 && a[1] <= b[1] + 1e-8;
/** @param {number} v */
const isPositive = (v) => v > 1e-8;
/** @typedef {{id:string,kind:string,file:string,x:Span,z:Span,y:Span|null}} Reservation */
/** @typedef {{id:string,file:string,axis:string,across:Span,along:Span,floor:number}} Wall */
/** @type {Reservation[]} */
const boxes = [];
/** @type {Wall[]} */
const partitions = [];
/** @type {{id:string,wall:Wall,from:number,to:number}[]} */
const doors = [];
for (const { file, text } of sources) {
  for (const m of text.matchAll(/\{ id: "([^"]+)", kind: "([^"]+)",(?: space: "[^"]+",)? x: \[([^\]]+)\], z: \[([^\]]+)\](?:, y: \[([^\]]+)\])?/g))
    boxes.push({ id: m[1], kind: m[2], file, x: pair(m[3]), z: pair(m[4]), y: m[5] ? pair(m[5]) : null });
  for (const m of text.matchAll(/partition\(\{([\s\S]*?)\}\)/g)) {
    const part = m[1];
    const id = /id:\s*"([^"]+)"/.exec(part)?.[1];
    const axis = /axis:\s*"([xz])"/.exec(part)?.[1];
    const across = /across:\s*\[([^\]]+)\]/.exec(part)?.[1];
    const along = /along:\s*\[([^\]]+)\]/.exec(part)?.[1];
    if (!id || !axis || !across || !along) throw new Error(`Unparsed partition in ${file}`);
    const floor = /storey:\s*"upper-storey"/.test(part) || /storey:\s*"upper-storey"/.test(text.slice(0, text.indexOf("reservations:"))) ? upperFloor : 0;
    const wall = { id, file, axis, across: pair(across), along: pair(along), floor };
    partitions.push(wall);
    for (const hole of part.matchAll(/door\("([^"]+)",\s*(?:"[^"]+"|storey),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g))
      if (!hole[1].endsWith("-opening")) doors.push({ id: hole[1], wall, from: Number(hole[2]), to: Number(hole[3]) });
  }
}
// The attached garage's shared wall is outside rooms/*.ts, but its door is
// governed by the same interior-door model section.
const garage = fs.readFileSync(path.join(root, "src/spaces/garage.ts"), "utf8");
const shared = /across:\s*\[MAIN\.inner\.x\[1\], MAIN\.outer\.x\[1\]\][\s\S]*?holes:\s*\[\{ id: "([^"]+)", from: ([^,]+), to: ([^,]+)/.exec(garage);
const building = fs.readFileSync(path.join(root, "src/spaces/building.ts"), "utf8");
const wallX = /inner:\s*\{[^}]*x:\s*\[([^\]]+)\]/.exec(building);
const outerX = /outer:\s*\{[^}]*x:\s*\[([^\]]+)\]/.exec(building);
if (!shared || !wallX || !outerX) throw new Error("Garage shared wall door source is not parseable");
/** @type {Wall} */
const garageWall = { id: "garage-shared-wall", file: "garage.ts", axis: "z", across: [pair(wallX[1])[1], pair(outerX[1])[1]], along: [-6.7, -0.3], floor: 0 };
partitions.push(garageWall);
doors.push({ id: shared[1], wall: garageWall, from: Number(shared[2]), to: Number(shared[3]) });
if (doors.length !== 11) throw new Error(`Expected eleven authored interior doors; found ${doors.length}: ${doors.map((d) => d.id).join(", ")}`);

/** A reservation is an allowed host envelope. An actual casing may overlap
 * that envelope only where the host document explicitly subtracts the overlap. */
const modelFiles = fs.readdirSync(path.join(root, "docs/models")).filter((f) => f.endsWith(".md"));
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
/** @param {{x:Span,z:Span,y:Span}} hit */
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
let reservationIntersections = 0;
let partitionIntersections = 0;
for (const door of doors) {
  const { axis, across, floor } = door.wall;
  const [from, to] = [door.from, door.to];
  /** @type {Span[]} */
  const faces = [[across[0] - projection, across[0]], [across[1], across[1] + projection]];
  /** @type {[number,number,number,number][]} */
  const strips = [[from - casingWidth, from, 0, 2.2], [to, to + casingWidth, 0, 2.2],
    [from - casingWidth, to + casingWidth, 2.2, headTop]];
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
    if (override) { x = override.x; z = override.z; }
    const y = [floor + low, floor + high];
    for (const p of partitions) {
      if (p.floor !== floor || p.id === door.wall.id) continue;
      const wx = p.axis === "z" ? p.across : p.along;
      const wz = p.axis === "z" ? p.along : p.across;
      if (isPositive(overlap(x, wx)) && isPositive(overlap(z, wz))) {
        partitionIntersections++;
        failures.push(`${door.id} casing intersects ${p.file}:${p.id} x=${x} z=${z}`);
      }
    }
    for (const box of boxes) {
      if (!box.y || box.kind === "swing" || box.kind === "use" || box.kind === "route") continue;
      const by = box.file.match(/bedroom|primary|shower|tub|upper-hall|wardrobe/) ? box.y.map((v) => v + upperFloor) : box.y;
      /** @type {{x:Span,z:Span,y:Span}} */
      const hit = { x: [Math.max(x[0], box.x[0]), Math.min(x[1], box.x[1])],
        z: [Math.max(z[0], box.z[0]), Math.min(z[1], box.z[1])],
        y: [Math.max(y[0], by[0]), Math.min(y[1], by[1])] };
      if (![hit.x, hit.z, hit.y].every((v) => isPositive(v[1] - v[0]))) continue;
      reservationIntersections++;
      if (!hasSubtraction(hit)) failures.push(`${door.id} casing intersects ${box.file}:${box.id} without model subtraction x=${hit.x} z=${hit.z} y=${hit.y}`);
    }
  }
}
console.log(JSON.stringify({ doors: doors.length, partitions: partitions.length, reservationBoxes: boxes.length, reservationIntersections, partitionIntersections, failures }));
if (failures.length) process.exitCode = 1;
