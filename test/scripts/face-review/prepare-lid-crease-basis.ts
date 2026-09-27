/**
 * Prepare the lid crease revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lid-crease-basis.ts STUDY REVISION OUTPUT
 *
 * Each upper lid's fold convexity keeps, on its concave side, only the
 * crease's depth along the skin (`prepareLidCreaseBasis`), and the side
 * returns to -1. The revision is checked for faults against the neutral at
 * both lids' -1 (`faceSupportFaults`), and the receipt gives the crease's
 * depth at -1 beside the upper lid's skin and orbicularis thickness (0.98
 * and 0.76 mm by high-frequency ultrasound, 48 adults aged 17 to 46: Rad
 * Proc 2021;26), the fold of one layer the crease draws.
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
import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";
import { prepareLidCreaseBasis } from "./prepareLidCreaseBasis";

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
const channels = ["leftEyelidFoldConvexity", "rightEyelidFoldConvexity"];
const prepared = prepareLidCreaseBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  skin: "Human",
  channels,
});
const human = prepared.basis.surfaces.find((one) => one.id === "Human")!;
const skinAt = (weight: number) =>
  faceShapeFitSurfacePositions(
    prepared.basis,
    createHumanFaceBasisBuilder(prepared.basis)({
      id: "probe",
      name: "probe",
      basis: prepared.basis.id,
      shape: Object.fromEntries(channels.map((one) => [one, weight])),
      expression: {},
    }),
    "Human",
  );
const triangles: number[] = [];
for (let t = 0; t < human.indices.length; t += 3) triangles.push(t);
const faults = faceSupportFaults({
  source: skinAt(0),
  positions: skinAt(-1),
  indices: human.indices,
  triangles,
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
const mm = (value: number) => Number((value * 1000).toFixed(3));
const receipt = {
  ...prepared.receipt,
  channels: prepared.receipt.channels.map((one) => ({
    ...one,
    depth: mm(one.depth),
    dropped: mm(one.dropped),
  })),
  layer: { skin: 0.98, orbicularis: 0.76, total: 1.74 },
  faultsAtMinimum: faults,
  recorded: new Date().toISOString(),
  citations:
    "Upper eyelid skin with subcutaneous tissue 0.98 +- 0.17 mm, orbicularis oculi 0.76 +- 0.1 mm, high-frequency ultrasound, 48 healthy adults aged 17 to 46 (Rad Proc 2021;26).",
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "lid-crease-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...receipt, inputs: undefined, outputs: undefined },
    null,
    2,
  ),
);
