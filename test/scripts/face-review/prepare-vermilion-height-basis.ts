/**
 * Prepare the vermilion height revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-vermilion-height-basis.ts STUDY REVISION OUTPUT
 *
 * Each lip is the part of the lips' region nearer its own meeting point
 * (`basis.contact.lips`) along the surface; subnasale and the labiomental
 * fold (supramentale) are the neutral's, on its midsagittal profile as the
 * unseen readings take them. One unit moves a vermilion vertex 15 percent of
 * its height above (below) its column's free margin, the column 1.5 mm
 * across, and the skin that follows reaches a centimetre beyond the lip's
 * corner (the modiolus). Rendered through the editor, 45 percent thinner
 * reads as a thin lip with its border smooth on both lips and 30 percent
 * fuller as a full upper lip, so the upper envelope runs from -3 to 2. The
 * source's lower vermilion is already 13 mm at the midline with 4 mm of
 * cutaneous lip left above the labiomental fold, and 30 percent fuller
 * brings its border against the fold, overhanging it; its envelope stops at
 * 1, the border 2 mm down (`prepareVermilionHeightBasis`).
 * The revision is refused unless every document and each channel at its
 * ends build, and each end turns over or crosses none of the skin's
 * triangles it moves (`faceSupportFaults`).
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { faceSupportFaults } from "./faceEnvelope";
import {
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
  faceProfileLandmarks,
} from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceMidlineTriangles } from "./faceUnseenNorms";
import { prepareVermilionHeightBasis } from "./prepareVermilionHeightBasis";

const [studyDirectory, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the new revision and a new output directory.",
  );
const read = (name: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(path.join(studyDirectory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const source = basis.json as IAutoMovieHumanFaceBasis;
const rest = faceShapeFitSurfacePositions(
  source,
  createHumanFaceBasisBuilder(source)({
    id: "neutral",
    name: "neutral",
    basis: source.id,
    shape: {},
    expression: {},
  }),
  "Human",
);
const { upper, lower } = source.contact!.lips;
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
const prepared = prepareVermilionHeightBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  skin: "Human",
  lips: "Human/lips",
  sides: [
    {
      channel: "upperVermilionHeight",
      lip: "upper",
      reach: base.subnasale[0],
      envelope: [-3, 2],
    },
    {
      channel: "lowerVermilionHeight",
      lip: "lower",
      reach: fold[0],
      envelope: [-3, 1],
    },
  ],
  unit: 0.15,
  column: 0.0015,
  margin: 0.01,
});
const build = createHumanFaceBasisBuilder(prepared.basis);
const ends = prepared.basis.channels
  .filter((one) => one.id.endsWith("VermilionHeight"))
  .flatMap(({ id: channel, minimum, maximum }) =>
    [minimum, maximum].map((end) => ({
      label: `${channel} ${end}`,
      document: {
        id: "end",
        name: "end",
        basis: prepared.basis.id,
        shape: { [channel]: end },
        expression: {},
      },
    })),
  );
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
const neutral = faceShapeFitSurfacePositions(
  prepared.basis,
  build({ ...ends[0]!.document, shape: {} }),
  "Human",
);
const faulted = ends.flatMap(({ label, document }) => {
  const [channel, end] = Object.entries(document.shape)[0]!;
  const one = prepared.basis.channels.find((c) => c.id === channel)!;
  const flat = surface.targets[end > 0 ? one.positive! : one.negative!]!;
  const support = new Set<number>();
  for (let i = 0; i < flat.length; i += 4) support.add(flat[i]!);
  const triangles: number[] = [];
  for (let t = 0; t < surface.indices.length; t += 3)
    if ([0, 1, 2].some((e) => support.has(surface.indices[t + e]!)))
      triangles.push(t);
  const faults = faceSupportFaults({
    source: neutral,
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
fs.mkdirSync(output, { recursive: true });
const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
  level: 9,
});
fs.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(prepared.documents, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "simple-controls.json"),
  JSON.stringify(prepared.controls, null, 2) + "\n",
);
const digest = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const receipt = {
  ...prepared.receipt,
  recorded: new Date().toISOString(),
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "vermilion-height-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt));
