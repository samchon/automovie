import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import { bodyPoseDefectZone } from "./bodyPoseDefectZone";
import {
  type IBodyPoseDefectRow,
  formatBodyPoseDefectTable,
} from "./formatBodyPoseDefectTable";
import { measureBodyPoseDefects } from "./measureBodyPoseDefects";

/**
 * Census what each standard pose does to each standard body's skin, so that a
 * change to the basis, the weights, the correctives or the rig can be judged
 * by its before and after tables.
 *
 * Usage, from `test/`:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/pose-defect-census.ts <label> [shapes] [poses]`
 * where `shapes` and `poses` are comma separated names of
 * `standardBodyReviewStates` (defaults: every body shape, every pose). The
 * shape of a state is its channels and the pose is its joint rows and
 * shoulder goals; a shape is built at rest first and each pose is compared
 * with that same body. It writes `.shots/pose-defect-census/<label>.md` and
 * `<label>.json` (the basis id, the git head, the rows and the refusals),
 * local and ignored, and prints the table. `measureBodyPoseDefects` owns the
 * measures and reads the skin in basis order through `posedSurfaces`.
 */
const label = process.argv[2];
if (label === undefined || label.startsWith("--"))
  throw new Error("Give a label for the census as the first argument.");
const root = path.resolve(__dirname, "../../..");
const basis = JSON.parse(
  zlib
    .gunzipSync(
      fs.readFileSync(
        path.join(root, "test/studies/human-body/connected-basis/basis.json.gz"),
      ),
    )
    .toString("utf8"),
) as IAutoMovieHumanBodyBasis;
const states = standardBodyReviewStates();
const pick = (argument: string | undefined, fallback: string[]): string[] =>
  argument === undefined ? fallback : argument.split(",");
const poseNames = Object.entries(states)
  .filter(([, state]) => state.pose.length > 0 || state.shoulders !== undefined)
  .map(([name]) => name);
const shapeNames = Object.entries(states)
  .filter(([, state]) => state.pose.length === 0 && state.shoulders === undefined)
  .map(([name]) => name);
const build = createHumanBodyBasisBuilder(basis);
const surface = basis.surfaces[0];
const zones = Array.from({ length: surface.positions.length / 3 }, (_, v) => {
  let best = 0;
  for (let k = 1; k < 4; ++k)
    if (surface.skin.weights[4 * v + k] > surface.skin.weights[4 * v + best])
      best = k;
  return bodyPoseDefectZone(surface.skin.joints[surface.skin.boneIndices[4 * v + best]]);
});
const rows: IBodyPoseDefectRow[] = [];
for (const shape of pick(process.argv[3], shapeNames)) {
  const rest = build({
    id: shape,
    name: shape,
    basis: basis.id,
    shape: states[shape].shape,
  }).posedSurfaces[0].positions;
  for (const pose of pick(process.argv[4], poseNames)) {
    try {
      const posed = build({
        id: shape + "-" + pose,
        name: shape + "-" + pose,
        basis: basis.id,
        shape: states[shape].shape,
        pose: states[pose].pose,
        shoulders: states[pose].shoulders,
      }).posedSurfaces[0].positions;
      rows.push({
        shape,
        pose,
        defects: measureBodyPoseDefects({
          indices: surface.indices,
          rest,
          posed,
          zoneOfVertex: (v) => zones[v],
        }),
      });
    } catch (error) {
      rows.push({
        shape,
        pose,
        defects: null,
        refused: (error as Error).message.slice(0, 120),
      });
    }
    console.log(shape, pose);
  }
}
const directory = path.join(root, ".shots/pose-defect-census");
fs.mkdirSync(directory, { recursive: true });
const table = formatBodyPoseDefectTable(rows);
fs.writeFileSync(path.join(directory, label + ".md"), table);
fs.writeFileSync(
  path.join(directory, label + ".json"),
  JSON.stringify(
    {
      basis: basis.id,
      head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root })
        .toString()
        .trim(),
      rows,
    },
    null,
    1,
  ),
);
console.log(table);
