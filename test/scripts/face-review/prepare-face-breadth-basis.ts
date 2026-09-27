/**
 * Prepare the face breadth revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-face-breadth-basis.ts STUDY REVISION OUTPUT
 *
 * The frame is read on the source's neutral skin (`prepareFaceBreadthBasis`):
 * the outer canthus as the globes' lateral extreme (the lateral canthus
 * lies over it), the brows' height as the
 * brow cards' mean, the zygion's as the height below the brows and above
 * the mouth where the face (the auricles left out) is broadest from the
 * front and the face's side as half that breadth, the nasal tip as the
 * most anterior skin vertex within 3 mm of the midline, the mouth's line
 * as the commissures' mean height (the lips' region's vertices on the skin
 * at its extreme sides), and the ears' depth as the auricles' mean. The unit
 * is 4 mm a side at full span. Its ends are checked for faults on the
 * neutral (`faceSupportFaults`).
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
import { faceUnseenParts } from "./faceUnseenNorms";
import { prepareFaceBreadthBasis } from "./prepareFaceBreadthBasis";

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
const P = human.positions;
const eyes = source.surfaces.find((one) => one.id === "Human.low-poly")!;
const E = eyes.positions;
// The globes' lateral extreme: the lateral canthus lies over it.
const lateral: number[] = [];
for (let i = 0; i < E.length; i += 3) lateral.push(Math.abs(E[i]!));
const canthus = Math.max(...lateral);
const brows = source.surfaces.find((one) => one.id === "Human.eyebrow001")!;
const brow =
  brows.positions.filter((_, k) => k % 3 === 1).reduce((a, b) => a + b, 0) /
  (brows.positions.length / 3);
const parts = faceUnseenParts(source, human);
const auricle = new Set([...parts.auricles.left, ...parts.auricles.right]);
const ear = [...auricle].reduce((s, v) => s + P[3 * v + 2]!, 0) / auricle.size;
const lips = human.regions.find((one) => one.id === "Human/lips")!;
const skinVertices = new Set(
  human.regions
    .filter((one) => one.id.endsWith("/skin"))
    .flatMap((one) => one.indices),
);
const cheilia = [...new Set(lips.indices)].filter((v) => skinVertices.has(v));
const xs = cheilia.map((v) => P[3 * v]!);
const corners = cheilia.filter(
  (v) => P[3 * v]! === Math.max(...xs) || P[3 * v]! === Math.min(...xs),
);
const mouth = corners.reduce((s, v) => s + P[3 * v + 1]!, 0) / corners.length;
let tipVertex = -1;
for (let v = 0; v < P.length / 3; ++v)
  if (
    Math.abs(P[3 * v]!) < 0.003 &&
    (tipVertex < 0 || P[3 * v + 2]! > P[3 * tipVertex + 2]!)
  )
    tipVertex = v;
const tip = P[3 * tipVertex + 1]!;
// The face's frontal breadth by height, the auricles and the head behind
// them left out.
const breadth = (y: number) => {
  let most = 0;
  for (let v = 0; v < P.length / 3; ++v)
    if (
      !auricle.has(v) &&
      Math.abs(P[3 * v + 1]! - y) < 0.001 &&
      P[3 * v + 2]! > ear
    )
      most = Math.max(most, Math.abs(P[3 * v]!));
  return most;
};
let zygion = tip;
for (let y = tip; y < brow; y += 0.0005)
  if (breadth(y) > breadth(zygion)) zygion = y;
const frame = {
  canthus,
  side: breadth(zygion),
  brow,
  zygion,
  tip,
  mouth,
  ear,
  behind: 0.03,
};
const prepared = prepareFaceBreadthBasis({
  basis: source,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  skin: "Human",
  channel: "faceBreadth",
  frame,
  unit: 0.004,
  envelope: [-2, 2],
});
const skinAt = (weight: number) =>
  faceShapeFitSurfacePositions(
    prepared.basis,
    createHumanFaceBasisBuilder(prepared.basis)({
      id: "probe",
      name: "probe",
      basis: prepared.basis.id,
      shape: { faceBreadth: weight },
      expression: {},
    }),
    "Human",
  );
const rest = skinAt(0);
const triangles: number[] = [];
for (let t = 0; t < human.indices.length; t += 3) triangles.push(t);
const faults = [-2, 2].map((w) =>
  faceSupportFaults({
    source: rest,
    positions: skinAt(w),
    indices: human.indices,
    triangles,
  }),
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
  faultsAtEnds: faults,
  recorded: new Date().toISOString(),
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "face-breadth-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  JSON.stringify({ ...prepared.receipt, faultsAtEnds: faults }, null, 2),
);
