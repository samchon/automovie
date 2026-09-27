/**
 * Split the smile retraction off the published smile channels, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/split-smile-retraction-basis.ts STUDY SOURCE_BASIS REVISION OUTPUT
 *
 * SOURCE_BASIS is the basis the smile retraction revision was prepared from
 * (`mpfb-connected-head-2026-09-27-nasal-root`), whose smile rows the smile
 * channels take back; `mouthSmileRetractLeft` and `mouthSmileRetractRight`
 * carry the difference (`splitSmileRetractionBasis`). The receipt checks
 * that both smiles and both retractions at one weight rebuild the published
 * full smile's skin exactly (the largest vertex difference).
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

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import {
  FACE_SMILE_RETRACTION_UNITS,
  splitSmileRetractionBasis,
} from "./splitSmileRetractionBasis";

const [studyDirectory, sourceFile, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  sourceFile === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the source basis, the new revision and a new output directory.",
  );
const read = (file: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(file);
  return {
    bytes,
    json: JSON.parse(
      (file.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read(path.join(studyDirectory, "basis.json.gz"));
const subjects = read(path.join(studyDirectory, "subjects.json"));
const controls = read(path.join(studyDirectory, "simple-controls.json"));
const source = read(sourceFile);
const published = basis.json as IAutoMovieHumanFaceBasis;
const prepared = splitSmileRetractionBasis({
  basis: published,
  source: source.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  channels: {
    left: FACE_SMILE_RETRACTION_UNITS[0].smile,
    right: FACE_SMILE_RETRACTION_UNITS[1].smile,
  },
  into: {
    left: FACE_SMILE_RETRACTION_UNITS[0].retraction,
    right: FACE_SMILE_RETRACTION_UNITS[1].retraction,
  },
});
const skin = (
  one: IAutoMovieHumanFaceBasis,
  expression: Record<string, number>,
) =>
  faceShapeFitSurfacePositions(
    one,
    createHumanFaceBasisBuilder(one)({
      id: "probe",
      name: "probe",
      basis: one.id,
      shape: {},
      expression,
    }),
    "Human",
  );
const before = skin(published, { mouthSmileLeft: 1, mouthSmileRight: 1 });
const after = skin(prepared.basis, {
  mouthSmileLeft: 1,
  mouthSmileRight: 1,
  mouthSmileRetractLeft: 1,
  mouthSmileRetractRight: 1,
});
const largest = before.reduce(
  (most, value, i) => Math.max(most, Math.abs(value - after[i]!)),
  0,
);
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
  sourceBasis: (source.json as IAutoMovieHumanFaceBasis).id,
  fullSmileLargestDifferenceMetres: largest,
  recorded: new Date().toISOString(),
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    source: { sha256: digest(source.bytes), bytes: source.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "smile-retraction-split-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...receipt, inputs: undefined, outputs: undefined },
    null,
    2,
  ),
);
