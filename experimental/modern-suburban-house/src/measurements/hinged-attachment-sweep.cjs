/** Numerically sweep an authored hinged solid against the emitted fixed fence.
 * The dimensions come from the model H2 and obstacle boxes from spaces meshes. */
const fs = require("node:fs");
const path = require("node:path");
const { intersectionArea } = require("./segmented-panel-sweep.cjs");
require(require.resolve("tsx/cjs"));
const { buildHouse } = require("../spaces/house.ts");

/** @typedef {[number,number]} Span */
/** @typedef {[number,number]} Point */
const number = "([−-]?\\d+(?:\\.\\d+)?)";
/** @param {string} value */
const numeric = (value) => Number(value.replace("−", "-"));
/** @param {string} source @param {RegExp} pattern @param {string} label */
function read(source, pattern, label) {
  const result = pattern.exec(source);
  if (!result) throw Error(`missing ${label}`);
  return result.slice(1).map(numeric);
}
/** @param {number[]} positions */
function bounds(positions) {
  /** @type {[Span,Span,Span]} */
  const spans = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]];
  for (let i = 0; i < positions.length; i += 3) for (let axis = 0; axis < 3; axis++) {
    spans[axis][0] = Math.min(spans[axis][0], positions[i + axis]);
    spans[axis][1] = Math.max(spans[axis][1], positions[i + axis]);
  }
  return { x: spans[0], y: spans[1], z: spans[2] };
}
/** @param {Span} x @param {Span} z @returns {Point[]} */
const rectangle = (x, z) => [[x[0], z[0]], [x[1], z[0]], [x[1], z[1]], [x[0], z[1]]];
/** @param {Point} point @param {Point} pivot @param {number} angle @returns {Point} */
function rotate(point, pivot, angle) {
  const dx = point[0] - pivot[0], dz = point[1] - pivot[1];
  return [pivot[0] + dx * Math.cos(angle) - dz * Math.sin(angle),
    pivot[1] + dx * Math.sin(angle) + dz * Math.cos(angle)];
}
/** @param {string} section */
function geometry(section) {
  const axisLine = section.split("\n").find((line) => line.includes("경첩축은 X="));
  if (!axisLine) throw Error("missing vertical hinge axis sentence");
  const [axisX, axisZ] = read(axisLine, new RegExp(`X=${number} m[^X\n]*?Z=${number} m`), "hinge coordinates");
  const [radius] = read(axisLine, new RegExp(`반지름 ${number} m`), "hinge radius");
  const attachmentLine = section.split("\n").find((line) => line.includes("자유단 X=") && line.includes("깊이 "));
  if (!attachmentLine) throw Error("missing rigid attachment dimensions");
  const [depth] = read(attachmentLine, new RegExp(`깊이 ${number} m`), "attachment depth");
  const [x0, x1] = read(attachmentLine, new RegExp(`자유단 X=${number} m[^\n]*?X=${number} m까지`), "attachment ends");
  const zCandidates = [...section.matchAll(new RegExp(`Z=\\[${number},${number}\\] m`, "g"))]
    .map((match) => /** @type {Span} */ ([numeric(match[1]), numeric(match[2])]))
    .filter(([lo, hi]) => Math.abs(hi - lo - depth) < 1e-8 && Math.abs(hi - axisZ) < 1e-8);
  if (!zCandidates.length) throw Error("missing attachment depth interval at hinged face");
  return { axisX, axisZ, radius, x: /** @type {Span} */ ([x0, x1]), z: zCandidates[0] };
}
/** @param {ReturnType<typeof geometry>} member @param {{box:ReturnType<typeof bounds>}[]} fixed @param {number} [steps] */
function sweep(member, fixed, steps = 180) {
  let maximumArea = 0, hingePenetration = 0, comparisons = 0;
  const pivot = /** @type {Point} */ ([member.axisX, member.axisZ]);
  for (const obstacle of fixed) {
    const obstaclePlan = rectangle(obstacle.box.x, obstacle.box.z);
    for (let step = 0; step <= steps; step++) {
      const angle = Math.PI * step / (2 * steps);
      const moved = rectangle(member.x, member.z).map((point) => rotate(point, pivot, angle));
      maximumArea = Math.max(maximumArea, intersectionArea(moved, obstaclePlan));
      comparisons++;
    }
    const dx = Math.max(obstacle.box.x[0] - member.axisX, 0, member.axisX - obstacle.box.x[1]);
    const dz = Math.max(obstacle.box.z[0] - member.axisZ, 0, member.axisZ - obstacle.box.z[1]);
    hingePenetration = Math.max(hingePenetration, member.radius - Math.hypot(dx, dz));
  }
  const failures = [];
  if (maximumArea > 1e-8) failures.push(`swept rigid solid shares ${maximumArea.toFixed(8)} m2 with fixed solid`);
  if (hingePenetration > 1e-8) failures.push(`hinge cylinder penetrates fixed solid by ${hingePenetration.toFixed(6)} m`);
  return { samples: steps + 1, comparisons, maximumArea, hingePenetration, failures };
}
if (require.main === module) {
  try {
    const source = fs.readFileSync(path.resolve(__dirname, "../../docs/models/02-exterior-doors.md"), "utf8");
    const section = source.split(/^## /m).find((h2) => h2.split("\n", 1)[0].includes("{#side-yard-gate}"));
    if (!section) throw Error("missing hinged member owner H2");
    const member = geometry(section.replace(/<!--[\s\S]*?-->/g, ""));
    const fixed = buildHouse().parts.filter((part) => part.role === "fence")
      .map((part) => ({ box: bounds(part.mesh.positions) }))
      .filter(({ box }) => Math.abs((box.x[1] - box.x[0]) - (box.z[1] - box.z[0])) < 1e-5)
      .filter(({ box }) => box.x[0] > member.axisX - 0.20 && box.x[0] < member.axisX + 0.20);
    if (!fixed.length) throw Error("no fixed square section at hinge");
    const result = sweep(member, fixed);
    console.log(JSON.stringify({ ...result, obstacles: fixed.length }));
    if (result.failures.length) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
module.exports = { geometry, rotate, sweep };
