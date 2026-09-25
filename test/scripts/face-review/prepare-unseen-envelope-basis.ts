/**
 * Prepare the unseen envelope revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-unseen-envelope-basis.ts STUDY REVISION OUTPUT
 *
 * Each unseen reading (`FACE_UNSEEN_INDICES`) is read on the source's
 * neutral skin as the derivation reads it (`measureFaceUnseen` over the
 * midline's triangles, the scalp, the auricles and the head behind them,
 * `faceUnseenParts`), and its control spans the reading's adult reference
 * interval (`faceUnseenIntervals`, `prepareUnseenEnvelopeBasis`).
 */
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  FACE_UNSEEN_INDICES,
  faceMidlineTriangles,
  faceUnseenIntervals,
  faceUnseenParts,
  measureFaceUnseen,
} from "./faceUnseenNorms";
import { prepareUnseenEnvelopeBasis } from "./prepareUnseenEnvelopeBasis";

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
const human = source.surfaces.find((one) => one.id === "Human")!;
const lips = source.contact!.lips;
const parts = faceUnseenParts(source, human);
const midline = faceMidlineTriangles(human.positions, human.indices);
const intervals = faceUnseenIntervals();
const prepared = prepareUnseenEnvelopeBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  surface: "Human",
  indices: FACE_UNSEEN_INDICES,
  intervals,
  measure: (positions) =>
    measureFaceUnseen({
      positions,
      indices: midline,
      stomion: positions[3 * lips.upper + 1]!,
      inferius: positions[3 * lips.lower + 1]!,
      ...parts,
      step: 0.0001,
    }),
  step: 0.05,
  reach: 3,
});
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
  citations:
    "The norms and spreads are faceUnseenNorms' (FACE_UNSEEN_NORMS, FACE_UNSEEN_INDICES), each cited there.",
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "unseen-envelope-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
