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
import fs from "node:fs";

import { FACE_UNSEEN_INDICES } from "./faceUnseenIndices";
import {
  faceMidlineTriangles,
  faceUnseenParts,
  measureFaceUnseen,
} from "./faceUnseenNorms";
import { faceUnseenIntervals } from "./faceUnseenPopulation";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareUnseenEnvelopeBasis } from "./prepareUnseenEnvelopeBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const human = source.surfaces.find((one) => one.id === "Human")!;
const lips = source.contact!.lips;
const parts = faceUnseenParts(source, human);
const midline = faceMidlineTriangles(human.positions, human.indices);
const intervals = faceUnseenIntervals();
const prepared = prepareUnseenEnvelopeBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  surface: "Human",
  // A stand-in for a photograph's index keeps the photograph's envelope.
  indices: FACE_UNSEEN_INDICES.filter((one) => one.photographed === undefined),
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
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "unseen-envelope-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations:
      "The norms and spreads are faceUnseenNorms' (FACE_UNSEEN_NORMS, FACE_UNSEEN_INDICES), each cited there.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
