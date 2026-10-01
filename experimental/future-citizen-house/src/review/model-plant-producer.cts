// Deterministic measurement producer for the authored potted-plant H2.
// The H2's @plant-spec is the input; this module emits inspectable part rows.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const documentPath = resolve(__dirname, "../../docs/models/004-decor-and-fixtures.md");
const startMarker = "<!-- @generated-plant-parts:start -->";
const endMarker = "<!-- @generated-plant-parts:end -->";
type PlantSpec = {heights:number[],potHeight:number,potTopRadius:number,potBottomRadius:number,wallMinimum:number,wallFactor:number,soilSurface:number,stemRadius:number,stemTop:number,crownDiameterLimit:number,branchStart:number,branchPitch:number,branchLength:number,branchRadius:number,branchAzimuthsDegrees:number[],leafLength:number,leafWidth:number,leafThickness:number,leafFanDegrees:number};

function round(value: number) { return Number(value.toFixed(6)); }
function lower(value: number) { return Math.floor(value * 1e6 + 1e-9) / 1e6; }
function upper(value: number) { return Math.ceil(value * 1e6 - 1e-9) / 1e6; }
function bounds(lo: number, hi: number) { return ([lower(lo), upper(hi)] as [number,number]); }
function extent(pair: [number,number]) { return `${pair[0]}..${pair[1]}`; }

function specification(source: string) {
  const match = /^@plant-spec: (.+)$/m.exec(source);
  if (!match) throw Error("potted-plant: missing @plant-spec");
  const input = (JSON.parse(match[1]) as PlantSpec);
    const required: (keyof PlantSpec)[] = ["potHeight", "potTopRadius", "potBottomRadius", "wallMinimum", "wallFactor",
    "soilSurface", "stemRadius", "stemTop", "crownDiameterLimit", "branchStart", "branchPitch", "branchLength",
    "branchRadius", "leafLength", "leafWidth", "leafThickness", "leafFanDegrees"];
  if (!Array.isArray(input.heights) || input.heights.length !== 5 ||
    !required.every((key) => typeof input[key] === "number" && Number.isFinite(input[key])) ||
    !Array.isArray(input.branchAzimuthsDegrees) || input.branchAzimuthsDegrees.length !== 5 ||
    input.branchAzimuthsDegrees.some((angle) => !Number.isFinite(angle) || angle < 0 || angle >= 360 || angle % 15 !== 0) ||
    input.branchAzimuthsDegrees.some((angle, i) => i > 0 && angle <= input.branchAzimuthsDegrees[i - 1]))
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

function partsFor(input: ReturnType<typeof specification>, millimetres: number) {
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
  const bladeThickness = input.leafThickness * H;
    const parts: Array<{id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string}> = [];
    const add = (id: string, shape: string, x: [number,number], y: [number,number], z: [number,number], contact: string) => parts.push({ id, shape, x, y, z, contact });
  add("pot", "hollow", bounds(-potR, potR), bounds(0, input.potHeight * H), bounds(-potR, potR), "ground,soil");
  add("soil", "curved", bounds(-soilR, soilR), bounds(wall, input.soilSurface * H), bounds(-soilR, soilR), "pot,stem");
  add("stem", "cylinder", bounds(-stemR, stemR), bounds(input.soilSurface * H, input.stemTop * H),
    bounds(-stemR, stemR), "soil,branch-0,branch-1,branch-2,branch-3,branch-4");
  for (let i = 0; i < 5; i++) {
    const theta = input.branchAzimuthsDegrees[i] * Math.PI / 180;
    const ex = Math.cos(theta), ez = Math.sin(theta), px = -ez, pz = ex;
    const yi = (input.branchStart + input.branchPitch * i) * H;
    add(`branch-${i}`, "curved",
      bounds(Math.min(branchBase * ex, branchTip * ex) - branchR, Math.max(branchBase * ex, branchTip * ex) + branchR),
      bounds(yi - branchR, yi + branchR),
      bounds(Math.min(branchBase * ez, branchTip * ez) - branchR, Math.max(branchBase * ez, branchTip * ez) + branchR),
      `stem,leaf-${3 * i},leaf-${3 * i + 1},leaf-${3 * i + 2}`);
    for (let j = 0; j < 3; j++) {
      const angle = (j - 1) * input.leafFanDegrees * Math.PI / 180;
      const lateral = input.leafLength * H * Math.sin(angle);
      const yTop = yi + input.leafLength * H * Math.cos(angle);
      // Each blade is a five-vertex wedge. The branch cap touches its single
      // apex; width and one-sided radial thickness grow toward the tip.
      const xs = [leafBase * ex];
      const zs = [leafBase * ez];
      for (const side of [-1, 1]) for (const radial of [0, bladeThickness]) {
        xs.push((leafBase + radial) * ex + (lateral + side * bladeHalfWidth) * px);
        zs.push((leafBase + radial) * ez + (lateral + side * bladeHalfWidth) * pz);
      }
      add(`leaf-${3 * i + j}`, "curved",
        bounds(Math.min(...xs), Math.max(...xs)),
        bounds(yi, yTop),
        bounds(Math.min(...zs), Math.max(...zs)),
        `branch-${i}`);
    }
  }
  if (parts.length !== 23 || Math.max(...parts.map((part) => part.y[1])) > H + 0.000001)
    throw Error("potted-plant: part count or top exceeds declared height");
  const lateralLimit = input.leafLength * Math.sin(input.leafFanDegrees * Math.PI / 180) + input.leafWidth / 2;
  const radialLimit = Math.hypot(leafBase / H + input.leafThickness, lateralLimit);
  if (radialLimit > input.crownDiameterLimit / 2)
    throw Error("potted-plant: leaf reach exits declared crown diameter limit");
    const occupied = (axis: "x"|"y"|"z") => bounds(Math.min(...parts.map((part) => part[axis][0])),
    Math.max(...parts.map((part) => part[axis][1])));
  return { H, parts, envelope: { x: occupied("x"), y: occupied("y"), z: occupied("z") } };
}

function render(input: ReturnType<typeof specification>) {
    const output: string[] = [];
  for (const millimetres of input.heights) {
    const state = String(millimetres);
    const { parts, envelope } = partsFor(input, millimetres);
    const H = millimetres / 1000;
    const branchRadius = input.branchRadius * H;
    const baseRadius = (input.stemRadius + input.branchRadius) * H;
    const tipRadius = baseRadius + input.branchLength * H;
    const apexRadius = tipRadius + branchRadius;
    output.push(`@inventory ${state}: ${parts.map((part) => part.id).join(", ")}`);
    for (let i = 0; i < 5; i++) {
      const angle = input.branchAzimuthsDegrees[i] * Math.PI / 180;
      const ex = Math.cos(angle), ez = Math.sin(angle);
      const y = (input.branchStart + input.branchPitch * i) * H;
      output.push(`@plant-join ${state}: branch-${i}, ${round(baseRadius * ex)}, ${round(y)}, ${round(baseRadius * ez)}, ${round(tipRadius * ex)}, ${round(y)}, ${round(tipRadius * ez)}, ${round(branchRadius)}`);
      for (let j = 0; j < 3; j++)
        output.push(`@plant-apex ${state}: leaf-${3 * i + j}, ${round(apexRadius * ex)}, ${round(y)}, ${round(apexRadius * ez)}`);
    }
    output.push("", "| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |");
    output.push(`| @envelope | ${state} | * | bounds | ${extent(envelope.x)} | ${extent(envelope.y)} | ${extent(envelope.z)} | - |`);
    for (const part of parts) output.push(`| @part | ${state} | ${part.id} | ${part.shape} | ${extent(part.x)} | ${extent(part.y)} | ${extent(part.z)} | ${part.contact} |`);
    output.push("");
  }
  return output.join("\n").trimEnd();
}

function check(source: string) {
  const input = specification(source);
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker);
  if (start < 0 || end <= start) throw Error("potted-plant: generated block absent");
  const actual = source.slice(start + startMarker.length, end).trim();
  const expected = render(input);
  if (actual !== expected) throw Error("potted-plant: part table differs from deterministic H2 formula");
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

export { specification, partsFor, render, check };