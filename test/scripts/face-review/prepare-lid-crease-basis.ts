/**
 * Prepare the lid crease revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lid-crease-basis.ts STUDY REVISION OUTPUT
 *
 * Each upper lid's fold convexity keeps the source's concave rows (the
 * crease's cleft under the fold) and its concave side reaches the last
 * weight, stepping down from zero by 0.02, before both lids add a fault to
 * the neutral (`faceSupportFaults`; `prepareLidCreaseBasis`). The receipt gives
 * the crease's depth along the skin's normal at -1 beside the upper lid's
 * skin and orbicularis thickness (0.98 and 0.76 mm by high-frequency
 * ultrasound, 48 adults aged 17 to 46: Rad Proc 2021;26), the fold of one
 * layer the crease draws, and the faults at the minimum and one step past.
 */
import { createHumanFaceBasisBuilder } from "@automovie/human";
import fs from "node:fs";

import { faceSupportFaults } from "./faceEnvelope";
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareLidCreaseBasis } from "./prepareLidCreaseBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const source = basis.json;
const channels = ["leftEyelidFoldConvexity", "rightEyelidFoldConvexity"];
const input = {
  basis: source,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  channels,
};
// The rows' reach, read on the whole side before the minimum is known.
const open = prepareLidCreaseBasis({ ...input, minimum: -1 });
const human = open.basis.surfaces.find((one) => one.id === "Human")!;
const skinAt = (weight: number) =>
  faceShapeFitSurfacePositions(
    open.basis,
    createHumanFaceBasisBuilder(open.basis)({
      id: "probe",
      name: "probe",
      basis: open.basis.id,
      shape: Object.fromEntries(channels.map((one) => [one, weight])),
      expression: {},
    }),
    "Human",
  );
const triangles: number[] = [];
for (let t = 0; t < human.indices.length; t += 3) triangles.push(t);
const rest = skinAt(0);
const faultsAt = (weight: number) =>
  faceSupportFaults({
    source: rest,
    positions: skinAt(weight),
    indices: human.indices,
    triangles,
  });
let minimum = -0.02;
while (
  minimum - 0.02 >= -1 - 1e-9 &&
  faultsAt(Number((minimum - 0.02).toFixed(2))) === 0
)
  minimum = Number((minimum - 0.02).toFixed(2));
const faults = {
  atMinimum: faultsAt(minimum),
  past: minimum > -1 ? faultsAt(Number((minimum - 0.02).toFixed(2))) : null,
};
const prepared = prepareLidCreaseBasis({ ...input, minimum });
const mm = (value: number) => Number((value * 1000).toFixed(3));
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "lid-crease-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    channels: prepared.receipt.channels.map((one) => ({
      ...one,
      depth: mm(one.depth),
      slide: mm(one.slide),
    })),
    layer: { skin: 0.98, orbicularis: 0.76, total: 1.74 },
    faults,
    citations:
      "Upper eyelid skin with subcutaneous tissue 0.98 +- 0.17 mm, orbicularis oculi 0.76 +- 0.1 mm, high-frequency ultrasound, 48 healthy adults aged 17 to 46 (Rad Proc 2021;26).",
  },
  recorded: new Date(),
});
console.log(
  JSON.stringify(
    { ...receipt, inputs: undefined, outputs: undefined },
    null,
    2,
  ),
);
