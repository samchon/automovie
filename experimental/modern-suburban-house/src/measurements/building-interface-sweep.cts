import fs from "node:fs";
import path from "node:path";

const docs = path.resolve(__dirname, "../../docs");
require(require.resolve("tsx/cjs"));
import { buildHouse } from "../spaces/house";
type Span = [number, number];
type Box = { X:Span;Y:Span;Z:Span };
const num = "([−-]?\\d+(?:\\.\\d+)?)";
const value = (text: string) => Number(text.replace("−", "-"));
const sections = (source: string) => source.split(/^## /m).slice(1).map((raw) => ({
  anchor: /\{#([^}]+)\}/.exec(raw.split("\n", 1)[0])?.[1] ?? "",
  raw,
  body: raw.replace(/<!--[\s\S]*?-->/g, ""),
}));
const intervals = (text: string, axis: "X"|"Y"|"Z"): Span[] => [...text.matchAll(new RegExp(`${axis}\\s*=\\s*\\[\\s*${num}\\s*,\\s*${num}\\s*\\]`, "g"))]
  .map((match) => ([value(match[1]), value(match[2])] as Span));
function bounds(positions: number[]): Box {
    const box: Box = {
    X: [Infinity, -Infinity],
    Y: [Infinity, -Infinity],
    Z: [Infinity, -Infinity],
  };
  for (let i = 0; i < positions.length; i += 3) for (const [axis, offset] of [
    ["X", 0],
    ["Y", 1],
    ["Z", 2],
  ]) {
    const span = box[(axis as "X"|"Y"|"Z")];
    span[0] = Math.min(span[0], positions[i + (offset as number)]);
    span[1] = Math.max(span[1], positions[i + (offset as number)]);
  }
  return box;
}
const walls = buildHouse().parts.filter((part) => part.role === "wall" || part.role === "partition")
  .map((part) => ({ id: part.id, box: bounds(part.mesh.positions) }));
const overlap = (a: Span, b: Span) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]);
const touchesWall = (axis: "X"|"Y"|"Z", end: number, cross: Record<string, Span[]>) => walls.some(({ box }) => {
  if (!box[axis].some((plane) => Math.abs(plane - end) < 1e-8)) return false;
  return (["X", "Y", "Z"] as Array<"X"|"Y"|"Z">)
    .filter((other) => other !== axis)
    .every((other) => !cross[other]?.length || cross[other].some((span) => overlap(span, box[other]) > 1e-8));
});
function audit(files: { name:string;source:string }[]) {
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
      const axis = (claim[1] as "X"|"Y"|"Z");
      const preface = paragraph.slice(0, claim.index);
      const made = intervals(preface, axis);
            const cross: Record<string, Span[]> = {
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
export { intervals, audit };