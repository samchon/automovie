/**
 * Prepare the nasal root revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-nasal-root-basis.ts STUDY REVISION OUTPUT
 *
 * `nasalRootProjection`'s negative endpoint becomes its positive's rows
 * reversed (`prepareNasalRootBasis`), and its negative side is extended
 * again over the nasofrontal angle's adult reference interval
 * (`faceUnseenIntervals`) as the unseen envelope revision extends a control
 * (`extendFaceEnvelope`, the angle read on the neutral skin as the
 * derivation reads it, `measureFaceUnseen`), so a set-back root reaches the
 * populations' most acute angles on the new form.
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

import { extendFaceEnvelope } from "./faceEnvelope";
import {
  faceMidlineTriangles,
  faceUnseenIntervals,
  faceUnseenParts,
  measureFaceUnseen,
} from "./faceUnseenNorms";
import { prepareNasalRootBasis } from "./prepareNasalRootBasis";

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
const channel = "nasalRootProjection";
const prepared = prepareNasalRootBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  channel,
});
const human = prepared.basis.surfaces.find((one) => one.id === "Human")!;
const lips = prepared.basis.contact!.lips;
const parts = faceUnseenParts(prepared.basis, human);
const midline = faceMidlineTriangles(human.positions, human.indices);
const interval = faceUnseenIntervals().nasofrontal;
const envelope = extendFaceEnvelope({
  basis: prepared.basis,
  surface: human,
  channel,
  measure: (positions) =>
    measureFaceUnseen({
      positions,
      indices: midline,
      stomion: positions[3 * lips.upper + 1]!,
      inferius: positions[3 * lips.lower + 1]!,
      ...parts,
      step: 0.0001,
    }).nasofrontal ?? NaN,
  interval,
  guard: (positions) =>
    positions[3 * lips.upper + 1]! > positions[3 * lips.lower + 1]! ? 0 : 1,
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
  envelope: { reading: "nasofrontal", interval, ...envelope },
  recorded: new Date().toISOString(),
  citations:
    "The nasofrontal norms and spread are faceUnseenNorms' (FACE_UNSEEN_NORMS: Wen et al., PLoS One 2015;10:e0134525), cited there.",
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "nasal-root-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify({ ...prepared.receipt, envelope }, null, 2));
