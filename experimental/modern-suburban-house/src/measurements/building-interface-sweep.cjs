/** Compare authored end-face contact with emitted reviewed wall solids. The
 * checker scans all model H2s for axial two-end contact; it does not name a
 * particular fitting or room. Intersections use metric boxes from real meshes. */
const fs = require("node:fs");
const path = require("node:path");

const docs = path.resolve(__dirname, "../../docs");
require(require.resolve("tsx/cjs"));
const { buildHouse } = require("../spaces/house.ts");
/** @typedef {[number, number]} Span */
/** @typedef {{ X:Span;Y:Span;Z:Span }} Box */
const num = "([−-]?\\d+(?:\\.\\d+)?)";
/** @param {string} text */
const value = (text) => Number(text.replace("−", "-"));
/** @param {string} source */
const sections = (source) => source.split(/^## /m).slice(1).map((raw) => ({
  anchor: /\{#([^}]+)\}/.exec(raw.split("\n", 1)[0])?.[1] ?? "",
  raw,
  body: raw.replace(/<!--[\s\S]*?-->/g, ""),
}));
/** @param {string} text @param {"X"|"Y"|"Z"} axis @returns {Span[]} */
const intervals = (text, axis) => [...text.matchAll(new RegExp(`${axis}\\s*=\\s*\\[\\s*${num}\\s*,\\s*${num}\\s*\\]`, "g"))]
  .map((match) => /** @type {Span} */ ([value(match[1]), value(match[2])]));
/** @param {number[]} positions @returns {Box} */
function bounds(positions) {
  /** @type {Box} */
  const box = {
    X: [Infinity, -Infinity],
    Y: [Infinity, -Infinity],
    Z: [Infinity, -Infinity],
  };
  for (let i = 0; i < positions.length; i += 3) for (const [axis, offset] of [
    ["X", 0],
    ["Y", 1],
    ["Z", 2],
  ]) {
    const span = box[/** @type {"X"|"Y"|"Z"} */ (axis)];
    span[0] = Math.min(span[0], positions[i + /** @type {number} */ (offset)]);
    span[1] = Math.max(span[1], positions[i + /** @type {number} */ (offset)]);
  }
  return box;
}
const walls = buildHouse().parts.filter((part) => part.role === "wall" || part.role === "partition")
  .map((part) => ({ id: part.id, box: bounds(part.mesh.positions) }));
/** @param {Span} a @param {Span} b */
const overlap = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
/** @param {"X"|"Y"|"Z"} axis @param {number} end @param {Record<string, Span[]>} cross */
const touchesWall = (axis, end, cross) => walls.some(({ box }) => {
  if (!box[axis].some((plane) => Math.abs(plane - end) < 1e-8)) return false;
  return /** @type {Array<"X"|"Y"|"Z">} */ (["X", "Y", "Z"])
    .filter((other) => other !== axis)
    .every((other) => !cross[other]?.length || cross[other].some((span) => overlap(span, box[other]) > 1e-8));
});
/** @param {{ name:string;source:string }[]} files */
function audit(files) {
  const failures = [];
  let h2 = 0, axialClaims = 0, checkedIntervals = 0;
  for (const file of files) for (const section of sections(file.source)) {
    h2++;
    const targets = [...section.raw.matchAll(/^@evidence spaces\/([^#\s]+)#([^\s]+)/gm)]
      .map((match) => `${match[1]}#${match[2]}`);
    for (const paragraph of section.body.split(/\n+/)) {
      const claim = /(?:두|양쪽|양)\s*([XYZ])\s*끝면[^.\n]*(?:측벽|옆벽|양쪽 벽)[^.\n]*(?:맞대|닿)/.exec(
        paragraph,
      );
      if (!claim) continue;
      axialClaims++;
      const axis = /** @type {"X"|"Y"|"Z"} */ (claim[1]);
      const preface = paragraph.slice(0, claim.index);
      const made = intervals(preface, axis);
      /** @type {Record<string, Span[]>} */
      const cross = {
        X: intervals(preface, "X"),
        Y: intervals(preface, "Y"),
        Z: intervals(preface, "Z"),
      };
      if (!made.length || !targets.length) {
        failures.push(
          `${file.name}#${section.anchor}: axial contact lacks a model interval or cited spaces owner on ${axis}`,
        );
        continue;
      }
      for (const span of made) {
        checkedIntervals++;
        for (const end of span) if (!touchesWall(axis, end, cross))
          failures.push(
            `${file.name}#${section.anchor}: ${axis} end face ${end} does not meet a reviewed wall solid`,
          );
      }
    }
  }
  if (!axialClaims) failures.push("no axial contact claim was measured");
  return {
    files: files.length,
    h2,
    wallSolids: walls.length,
    axialClaims,
    checkedIntervals,
    failures,
  };
}

if (require.main === module) {
  const modelDir = path.join(docs, "models");
  const files = fs.readdirSync(modelDir).filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, source: fs.readFileSync(path.join(modelDir, name), "utf8") }));
  const result = audit(files);
  console.log(JSON.stringify(result));
  if (result.failures.length) process.exitCode = 1;
}
module.exports = { intervals, audit };
