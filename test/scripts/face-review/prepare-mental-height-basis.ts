/**
 * Prepare the mental height revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-mental-height-basis.ts STUDY REVISION OUTPUT
 *
 * The mandible's carry of each skin vertex is how far the jaw's full
 * opening moves it over how far it moves the lower lip's seam vertex
 * (`basis.contact.lips.lower`), capped at one. The labiomental fold is
 * supramentale and menton soft-tissue menton, both on the neutral's
 * midsagittal profile as the unseen readings take them
 * (`faceMidsagittalLandmarks`, `faceProfileLandmarks`). One unit moves menton
 * 5 mm; rendered through the editor from the front and in profile, 10 mm
 * shorter and taller read as a chin, and 15 mm shorter creases the skin
 * along the jaw's lower border, so the envelope runs from -2 to 2
 * (`prepareMentalHeightBasis`). The revision is refused unless every
 * document and the channel at both ends build.
 */
import { createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import {
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
  faceProfileLandmarks,
} from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceMidlineTriangles } from "./faceUnseenNorms";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareMentalHeightBasis } from "./prepareMentalHeightBasis";
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
const segments = faceMidsagittalSection(rest, midline);
const ys = segments.flatMap(([a, b]) => [a[0], b[0]]);
const fold = faceProfileLandmarks({
  profile: faceMidsagittalProfile(
    segments,
    Math.max(...ys),
    Math.min(...ys),
    0.0001,
  ),
  pronasale: base.pronasale,
  subnasale: base.subnasale,
  stomion,
  inferius: rest[3 * lower + 1]!,
  menton: base.menton,
  root: 0.1,
}).supramentale;
if (fold === null) throw new Error("The neutral has no labiomental fold.");
const prepared = prepareMentalHeightBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  channel: "mentalHeight",
  carry,
  fold: fold[0],
  menton: base.menton[0],
  unit: 0.005,
  envelope: [-2, 2],
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const refused = [
  ...prepared.documents.map((one) => ({ label: one.id, document: one })),
  ...[-2, 2].map((end) => ({
    label: `mentalHeight ${end}`,
    document: {
      id: "end",
      name: "end",
      basis: prepared.basis.id,
      shape: { mentalHeight: end },
      expression: {},
    },
  })),
].flatMap(({ label, document }) => {
  try {
    build(document);
    return [];
  } catch (error) {
    return [`${label}: ${(error as Error).message}`];
  }
});
if (refused.length !== 0) throw new Error(`Refused:\n${refused.join("\n")}`);
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "mental-height-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt));
