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
import fs from "node:fs";

import { extendFaceEnvelope } from "./extendFaceEnvelope";
import { faceMidlineTriangles, faceUnseenParts, measureFaceUnseen } from "./faceUnseenNorms";
import { faceUnseenIntervals } from "./faceUnseenPopulation";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareNasalRootBasis } from "./prepareNasalRootBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const channel = "nasalRootProjection";
const prepared = prepareNasalRootBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
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
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "nasal-root-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    envelope: { reading: "nasofrontal", interval, ...envelope },
    citations:
      "The nasofrontal norms and spread are faceUnseenNorms' (FACE_UNSEEN_NORMS: Wen et al., PLoS One 2015;10:e0134525), cited there.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify({ ...prepared.receipt, envelope }, null, 2));
