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
 * (`faceMidsagittalLandmarks`). One unit narrows the carried skin at menton
 * by a tenth of its distance from the midline (`prepareJawTaperBasis`).
 * The revision is refused unless every document and the channel at both
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
import { faceMidsagittalLandmarks } from "./faceMidsagittal";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceMidlineTriangles } from "./faceUnseenNorms";
import { prepareJawTaperBasis } from "./prepareJawTaperBasis";

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
const envelope: [number, number] = [-4, 3];
const prepared = prepareJawTaperBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  skin: "Human",
  channel: "jawTaper",
  carry,
  top,
  menton: base.menton[0],
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
  path.join(output, "jaw-taper-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt));
