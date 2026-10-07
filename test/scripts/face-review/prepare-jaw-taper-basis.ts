/**
 * Prepare the jaw taper revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-jaw-taper-basis.ts STUDY REVISION OUTPUT
 *
 * The mandible's carry of each skin vertex is how far the jaw's full
 * opening moves it over how far it moves the lower lip's seam vertex
 * (`basis.contact.lips.lower`), capped at one. The mouth's line is the
 * cheilia's mean height, the lip region's outermost vertices it shares with
 * the skin (where `faceVermilionRatios` reads the mouth's width), and
 * menton soft-tissue menton on the neutral's midsagittal profile
 * (`faceMidsagittalLandmarks`), and the neck's rim the front of the skin's
 * open border below menton (its frontmost vertex's height, under the chin),
 * the border itself held (its carry nothing); taken at the border's highest
 * point, 4 mm below menton, the taper fell off so steeply under the chin
 * that it creased there. One unit narrows the carried skin at menton
 * by a tenth of its distance from the midline (`prepareJawTaperBasis`).
 * The revision is refused unless every document and the channel at both
 * ends build, and each end turns over or crosses none of the skin's
 * triangles it moves (`faceSupportFaults`).
 */
import { createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import { faceMidsagittalLandmarks } from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceSupportFaults } from "./faceSupportFaults";
import { faceMidlineTriangles } from "./faceUnseenNorms";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareJawTaperBasis } from "./prepareJawTaperBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const neutral = (expression: Record<string, number>) =>
  faceShapeFitSurfacePositions(
    source,
    createHumanFaceBasisBuilder(source)({
      id: "neutral",
      name: "neutral",
      basis: source.id,
      shape: {},
      expression,
    }),
    "Human",
  );
const rest = neutral({});
const opened = neutral({ [source.articulation!.jaw.opening.channel]: 1 });
const travel = (vertex: number) =>
  Math.hypot(
    ...[0, 1, 2].map((k) => opened[3 * vertex + k]! - rest[3 * vertex + k]!),
  );
const { upper, lower } = source.contact!.lips;
const seam = travel(lower);
const carry = [...new Array(rest.length / 3).keys()].map((vertex) =>
  Math.min(1, travel(vertex) / seam),
);
const human = source.surfaces.find((one) => one.id === "Human")!;
const stomion = (rest[3 * upper + 1]! + rest[3 * lower + 1]!) / 2;
const midline = faceMidlineTriangles(rest, human.indices);
const base = faceMidsagittalLandmarks({
  positions: rest,
  indices: midline,
  stomion,
  nose: [stomion + 0.015, stomion + 0.05],
  chinDepth: 0.03,
  level: 0.2,
  step: 0.0001,
});
// The cheilia: the lip region's outermost vertices shared with the skin.
const lips = new Set(
  human.regions.find((one) => one.id === "Human/lips")!.indices,
);
const border = [
  ...new Set(human.regions.find((one) => one.id === "Human/skin")!.indices),
].filter((v) => lips.has(v));
const side = (sign: number) =>
  border.reduce((best, v) =>
    sign * rest[3 * v]! > sign * rest[3 * best]! ? v : best,
  );
const top = (rest[3 * side(1) + 1]! + rest[3 * side(-1) + 1]!) / 2;
// The neck's rim: the skin's open border below menton, where the head meets
// the body; the taper falls to nothing at its front (the frontmost border
// vertex's height), under the chin, and the border itself stays.
const edges = new Map<string, number>();
for (let t = 0; t < human.indices.length; t += 3)
  for (let e = 0; e < 3; ++e) {
    const a = human.indices[t + e]!;
    const b = human.indices[t + ((e + 1) % 3)]!;
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  }
const neckBorder = new Set(
  [...edges]
    .filter(([, count]) => count === 1)
    .flatMap(([key]) => key.split(",").map(Number))
    .filter((v) => rest[3 * v + 1]! < base.menton[0]),
);
const front = [...neckBorder].reduce((best, v) =>
  rest[3 * v + 2]! > rest[3 * best + 2]! ? v : best,
);
const rim = rest[3 * front + 1]!;
// The chin's level: half the eyes' height (the globes' mean height, the eye
// surface's) above stomion below it, where the photographs' chin width is
// read (`FACE_LIKENESS_JAW_CHIN`).
const eyes = source.surfaces.find((one) => one.id === "Human.low-poly")!;
const eyeLine =
  eyes.positions.filter((_, k) => k % 3 === 1).reduce((a, b) => a + b, 0) /
  (eyes.positions.length / 3);
const stomionHeight = (rest[3 * upper + 1]! + rest[3 * lower + 1]!) / 2;
const level = stomionHeight - 0.5 * (eyeLine - stomionHeight);
const envelope: [number, number] = [-4, 3];
const prepared = prepareJawTaperBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  channel: "jawTaper",
  carry: carry.map((one, v) => (neckBorder.has(v) ? 0 : one)),
  top,
  level,
  menton: base.menton[0],
  rim,
  unit: 0.1,
  envelope,
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const ends = envelope.map((end) => ({
  label: `jawTaper ${end}`,
  document: {
    id: "end",
    name: "end",
    basis: prepared.basis.id,
    shape: { jawTaper: end },
    expression: {},
  },
}));
const refused = [
  ...prepared.documents.map((one) => ({ label: one.id, document: one })),
  ...ends,
].flatMap(({ label, document }) => {
  try {
    build(document);
    return [];
  } catch (error) {
    return [`${label}: ${(error as Error).message}`];
  }
});
if (refused.length !== 0) throw new Error(`Refused:\n${refused.join("\n")}`);
// Each end turns over or crosses none of the skin's triangles it moves.
const surface = prepared.basis.surfaces.find((one) => one.id === "Human")!;
const support = new Set<number>();
const rows = surface.targets["jawTaper.narrower"]!;
for (let i = 0; i < rows.length; i += 4) support.add(rows[i]!);
const triangles: number[] = [];
for (let t = 0; t < surface.indices.length; t += 3)
  if ([0, 1, 2].some((e) => support.has(surface.indices[t + e]!)))
    triangles.push(t);
const faulted = ends.flatMap(({ label, document }) => {
  const faults = faceSupportFaults({
    source: rest,
    positions: faceShapeFitSurfacePositions(
      prepared.basis,
      build(document),
      "Human",
    ),
    indices: surface.indices,
    triangles,
  });
  return faults === 0 ? [] : [`${label}: ${faults} faults`];
});
if (faulted.length !== 0) throw new Error(`Faulted:\n${faulted.join("\n")}`);
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "jaw-taper-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt));
