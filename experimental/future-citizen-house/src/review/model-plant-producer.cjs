// Deterministic measurement producer for the authored potted-plant H2.
// The H2's @plant-spec is the input; this module emits inspectable part rows.
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const documentPath = resolve(__dirname, "../../docs/models/004-decor-and-fixtures.md");
const startMarker = "<!-- @generated-plant-parts:start -->";
const endMarker = "<!-- @generated-plant-parts:end -->";
/** @typedef {{heights:number[],potHeight:number,potTopRadius:number,potBottomRadius:number,wallMinimum:number,wallFactor:number,soilSurface:number,stemRadius:number,stemTop:number,branchStart:number,branchPitch:number,branchLength:number,branchRadius:number,leafLength:number,leafWidth:number,leafThickness:number,leafFanDegrees:number}} PlantSpec */

/** @param {number} value */
function round(value) { return Number(value.toFixed(6)); }
/** @param {number} lo @param {number} hi */
function bounds(lo, hi) { return /** @type {[number,number]} */ ([round(lo), round(hi)]); }
/** @param {[number,number]} pair */
function extent(pair) { return `${pair[0]}..${pair[1]}`; }

/** @param {string} source */
function specification(source) {
  const match = /^@plant-spec: (.+)$/m.exec(source);
  if (!match) throw Error("potted-plant: missing @plant-spec");
  const input = /** @type {PlantSpec} */ (JSON.parse(match[1]));
  /** @type {(keyof PlantSpec)[]} */
  const required = ["potHeight", "potTopRadius", "potBottomRadius", "wallMinimum", "wallFactor",
    "soilSurface", "stemRadius", "stemTop", "branchStart", "branchPitch", "branchLength",
    "branchRadius", "leafLength", "leafWidth", "leafThickness", "leafFanDegrees"];
  if (!Array.isArray(input.heights) || input.heights.length !== 5 ||
    !required.every((key) => typeof input[key] === "number" && Number.isFinite(input[key])))
    throw Error("potted-plant: incomplete spec");
  const fixedHeights = [180, 280, 600, 800, 1100];
  if (input.heights.some((value, i) => value !== fixedHeights[i]))
    throw Error("potted-plant: height variants differ from H2 program");
  if (!(input.potBottomRadius < input.potTopRadius && input.soilSurface === input.potHeight &&
    input.stemTop === input.branchStart + 4 * input.branchPitch &&
    input.stemRadius + input.branchRadius < input.potTopRadius &&
    input.branchLength > 0 && input.leafFanDegrees > 0 && input.leafFanDegrees < 36))
    throw Error("potted-plant: proportions or joining formula invalid");
  return input;
}

/** @param {ReturnType<typeof specification>} input @param {number} millimetres */
function partsFor(input, millimetres) {
  const H = millimetres / 1000;
  const wall = Math.max(input.wallMinimum, input.wallFactor * H);
  if (!(wall > 0 && wall < input.potBottomRadius * H)) throw Error("plant wall consumes base");
  const potR = input.potTopRadius * H;
  const soilR = potR - wall;
  const branchR = input.branchRadius * H;
  const stemR = input.stemRadius * H;
  const branchBase = stemR + branchR;
  const branchTip = branchBase + input.branchLength * H;
  const leafBase = branchTip + branchR;
  const bladeHalfWidth = input.leafWidth * H / 2;
  const bladeHalfThickness = input.leafThickness * H / 2;
  /** @type {Array<{id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string}>} */
  const parts = [];
  /** @param {string} id @param {string} shape @param {[number,number]} x @param {[number,number]} y @param {[number,number]} z @param {string} contact */
  const add = (id, shape, x, y, z, contact) => parts.push({ id, shape, x, y, z, contact });
  add("pot", "hollow", bounds(-potR, potR), bounds(0, input.potHeight * H), bounds(-potR, potR), "ground,soil");
  add("soil", "curved", bounds(-soilR, soilR), bounds(wall, input.soilSurface * H), bounds(-soilR, soilR), "pot,stem");
  add("stem", "cylinder", bounds(-stemR, stemR), bounds(input.soilSurface * H, input.stemTop * H),
    bounds(-stemR, stemR), "soil,branch-0,branch-1,branch-2,branch-3,branch-4");
  for (let i = 0; i < 5; i++) {
    const theta = 2 * Math.PI * i / 5;
    const ex = Math.cos(theta), ez = Math.sin(theta), px = -ez, pz = ex;
    const yi = (input.branchStart + input.branchPitch * i) * H;
    add(`branch-${i}`, "curved",
      bounds(Math.min(branchBase * ex, branchTip * ex) - branchR, Math.max(branchBase * ex, branchTip * ex) + branchR),
      bounds(yi - branchR, yi + branchR),
      bounds(Math.min(branchBase * ez, branchTip * ez) - branchR, Math.max(branchBase * ez, branchTip * ez) + branchR),
      `stem,leaf-${3 * i},leaf-${3 * i + 1},leaf-${3 * i + 2}`);
    for (let j = 0; j < 3; j++) {
      const angle = (j - 1) * input.leafFanDegrees * Math.PI / 180;
      const radialTip = leafBase + input.leafLength * H * Math.sin(angle);
      const yTop = yi + input.leafLength * H * Math.cos(angle);
      const spreadX = Math.abs(px) * bladeHalfWidth + Math.abs(ex) * bladeHalfThickness;
      const spreadZ = Math.abs(pz) * bladeHalfWidth + Math.abs(ez) * bladeHalfThickness;
      add(`leaf-${3 * i + j}`, "curved",
        bounds(Math.min(leafBase * ex, radialTip * ex) - spreadX, Math.max(leafBase * ex, radialTip * ex) + spreadX),
        bounds(yi, yTop),
        bounds(Math.min(leafBase * ez, radialTip * ez) - spreadZ, Math.max(leafBase * ez, radialTip * ez) + spreadZ),
        `branch-${i}`);
    }
  }
  if (parts.length !== 23 || Math.max(...parts.map((part) => part.y[1])) > H + 0.000001)
    throw Error("potted-plant: part count or top exceeds declared height");
  const radialLimit = (leafBase / H) + input.leafLength * Math.sin(input.leafFanDegrees * Math.PI / 180) +
    input.leafWidth / 2 + input.leafThickness / 2;
  if (radialLimit > 0.31) throw Error("potted-plant: leaf reach exits declared 0.31H half width");
  /** @param {"x"|"y"|"z"} axis */
  const occupied = (axis) => bounds(Math.min(...parts.map((part) => part[axis][0])),
    Math.max(...parts.map((part) => part[axis][1])));
  return { H, parts, envelope: { x: occupied("x"), y: occupied("y"), z: occupied("z") } };
}

/** @param {ReturnType<typeof specification>} input */
function render(input) {
  /** @type {string[]} */
  const output = [];
  for (const millimetres of input.heights) {
    const state = String(millimetres);
    const { parts, envelope } = partsFor(input, millimetres);
    output.push(`@inventory ${state}: ${parts.map((part) => part.id).join(", ")}`);
    output.push("", "| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |");
    output.push(`| @envelope | ${state} | * | bounds | ${extent(envelope.x)} | ${extent(envelope.y)} | ${extent(envelope.z)} | - |`);
    for (const part of parts) output.push(`| @part | ${state} | ${part.id} | ${part.shape} | ${extent(part.x)} | ${extent(part.y)} | ${extent(part.z)} | ${part.contact} |`);
    output.push("");
  }
  return output.join("\n").trimEnd();
}

/** @param {string} source */
function check(source) {
  const input = specification(source);
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker);
  if (start < 0 || end <= start) throw Error("potted-plant: generated block absent");
  const actual = source.slice(start + startMarker.length, end).trim();
  const expected = render(input);
  if (actual !== expected) throw Error("potted-plant: part table differs from deterministic H2 formula");
  const section = source.slice(source.indexOf("{#potted-plant}"), source.indexOf("## ", source.indexOf("{#potted-plant}")));
  const expectedProse = ["0.18, 0.28, 0.60, 0.80, 1.10m", "0.34H", "0.38H",
    "max(0.006,0.018H)", "0.028H", "0.48+0.09i", "0.18H", "0.16H", "0.055H"];
  for (const token of expectedProse) if (!section.includes(token))
    throw Error(`potted-plant: prose does not declare ${token}`);
  if (!section.includes(`흙 표면은 ${input.soilSurface.toFixed(2)}H`))
    throw Error("potted-plant: prose soil surface differs from measured input");
  return input;
}

if (require.main === module) {
  const source = readFileSync(documentPath, "utf8");
  if (process.argv[2] === "--write") {
    const input = specification(source);
    const start = source.indexOf(startMarker), end = source.indexOf(endMarker);
    if (start < 0 || end <= start) throw Error("potted-plant: generated markers absent");
    const updated = source.slice(0, start + startMarker.length) + "\n" + render(input) + "\n" + source.slice(end);
    writeFileSync(documentPath, updated, "utf8");
  } else check(source);
}

module.exports = { specification, partsFor, render, check };
