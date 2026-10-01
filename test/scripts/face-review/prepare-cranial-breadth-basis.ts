/**
 * Prepare the cranial breadth revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-cranial-breadth-basis.ts STUDY REVISION OUTPUT NEUTRAL_BREADTH_MM
 *
 * STUDY is the published global-face study directory, REVISION the new basis
 * identity and OUTPUT a new directory that receives `basis.json.gz`, the
 * restamped and migrated subjects and controls, and
 * `cranial-breadth-receipt.json`. NEUTRAL_BREADTH_MM is the convention the
 * neutral head's breadth (euryon to euryon over the scalp) is set to: a
 * recorded choice that lies inside both sexes' observed ANSUR II head-breadth
 * range, never a permitted range (see `prepareCranialBreadthBasis`).
 *
 * The frame is read on the source's neutral (`measureCranialBreadthFrame`):
 * the scalp's vertices from the hair domains, the auricles of
 * `faceUnseenParts` and the brow cards. The unit is 5 mm a side at full span,
 * 10 mm of head breadth. The envelope [-1, 3] reaches 181 mm broader (the
 * widest observed head breadth is 180 mm) and, narrower, the source's own
 * breadth, because the vertices outside the control's span keep that breadth:
 * the response is linear to about -0.5 (146 mm) and then saturates, so heads
 * narrower than the source remain `headWidth`'s, which also narrows the face.
 * Its ends are checked for faults on the neutral (`faceSupportFaults`).
 */
import { createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { faceSupportFaults } from "./faceSupportFaults";
import { faceUnseenParts } from "./faceUnseenNorms";
import { measureCranialBreadthFrame } from "./measureCranialBreadthFrame";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareCranialBreadthBasis } from "./prepareCranialBreadthBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const argv = process.argv.slice(2);
const millimetres = Number(argv[3]);
if (!(millimetres > 0)) throw new Error("Supply the neutral breadth in mm.");
const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  argv.slice(0, 3),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const human = source.surfaces.find((one) => one.id === "Human")!;
const brows = source.surfaces.find((one) => one.id === "Human.eyebrow001")!;
const parts = faceUnseenParts(source, human);
const frame = measureCranialBreadthFrame({
  positions: human.positions,
  scalp: parts.scalp,
  auricles: [...parts.auricles.left, ...parts.auricles.right],
  brows: brows.positions,
});
const prepared = prepareCranialBreadthBasis({
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  channel: "cranialBreadth",
  frame,
  unit: 0.005,
  envelope: [-1, 3],
  neutralBreadth: millimetres / 1000,
});
const skinAt = (weight: number) =>
  faceShapeFitSurfacePositions(
    prepared.basis,
    createHumanFaceBasisBuilder(prepared.basis)({
      id: "probe",
      name: "probe",
      basis: prepared.basis.id,
      shape: { cranialBreadth: weight },
      expression: {},
    }),
    "Human",
  );
const rest = skinAt(0);
const triangles: number[] = [];
for (let t = 0; t < human.indices.length; t += 3) triangles.push(t);
const faults = [-1, 3].map((w) =>
  faceSupportFaults({
    source: rest,
    positions: skinAt(w),
    indices: human.indices,
    triangles,
  }),
);
const breadth = (positions: readonly number[]) =>
  2 * Math.max(...parts.scalp.map((v) => Math.abs(positions[3 * v]!)));
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "cranial-breadth-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    sourceBreadthMetres: 2 * frame.side,
    neutralBreadthMetres: breadth(rest),
    envelopeEndBreadthsMetres: [-1, 3].map((w) => breadth(skinAt(w))),
    faultsAtEnds: faults,
  },
  recorded: new Date(),
});
console.log(
  JSON.stringify(
    {
      ...prepared.receipt,
      neutralBreadthMetres: breadth(rest),
      faultsAtEnds: faults,
    },
    null,
    2,
  ),
);
