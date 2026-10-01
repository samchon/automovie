import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import { bodyCorrectiveBasisDigest } from "./bodyCorrectiveBasisDigest";
import { bodyPoseCensusSourceDigest } from "./bodyPoseCensusSourceDigest";
import { bodyPoseDefectZone } from "./bodyPoseDefectZone";
import { formatBodyPoseDefectTable } from "./formatBodyPoseDefectTable";
import type { IBodyPoseCensusIdentity } from "./IBodyPoseCensusIdentity";
import { readBodyPoseCensusArguments } from "./readBodyPoseCensusArguments";
import { resolveBodyPoseCensusInput } from "./resolveBodyPoseCensusInput";
import { runBodyPoseDefectCensus } from "./runBodyPoseDefectCensus";

/**
 * Census what each standard pose does to each standard body's skin, so that a
 * change to the basis, the weights, the correctives or the rig can be judged
 * by its before and after tables.
 *
 * Usage, from `test/`:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/pose-defect-census.ts <label> [shapes] [poses] [--basis <input.gz>]`
 * where `shapes` and `poses` are comma separated names of
 * `standardBodyReviewStates` (defaults: every body shape, every pose). The
 * shape of a state is its channels and the pose is its joint rows and
 * shoulder goals; a shape is built at rest first and each pose is compared
 * with that same body. It writes `.shots/pose-defect-census/<label>.md` and
 * `<label>.json` (the basis id, captured input identity, rows and refusals),
 * local and ignored, and prints the table. `measureBodyPoseDefects` owns the
 * measures and reads the skin in basis order through `posedSurfaces`.
 *
 * The source snapshot covers the numerical packages and engine kernels, the
 * census/review scripts, manifests, compiler configuration, dependency lock
 * and Node runtime. Exact source bytes and complete basis JSON are checked
 * before and after every state and before publication. A change aborts instead
 * of labeling mixed rows with the head found at the end. This deliberately
 * rejects even an unrelated edit within those covered package populations.
 * These are sampled identity checks, not a continuous filesystem monitor;
 * the shared checkout still needs a reserved source/basis freeze for the run.
 */
const options = readBodyPoseCensusArguments(process.argv.slice(2));
const label = options.label;
const root = path.resolve(__dirname, "../../..");
const basisPath = resolveBodyPoseCensusInput({
  selected: options.basis,
  shipped: path.join(root, "test/studies/human-body/connected-basis/basis.json.gz"),
  resolveExplicit: (file) => path.resolve(file),
});
const readBasis = (): IAutoMovieHumanBodyBasis => JSON.parse(
  zlib
    .gunzipSync(
      fs.readFileSync(basisPath),
    )
    .toString("utf8"),
) as IAutoMovieHumanBodyBasis;
const basis = readBasis();
const snapshot = (inputBasis = readBasis()): IBodyPoseCensusIdentity => ({
  basis: { id: inputBasis.id, sha256: bodyCorrectiveBasisDigest(inputBasis) },
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString().trim(),
  sourceSha256: bodyPoseCensusSourceDigest([
    ...[...new Set(fs.globSync([
      "packages/{human,engine,interface}/src/**/*.{ts,mts,cts,json}",
      "packages/engine/vendor/**/*.{wasm,js,mjs,cjs,ts,json,rs,toml,c,h}",
      "test/scripts/body-{basis,review}/**/*.{ts,mts,cts,json}",
      "packages/{human,engine,interface}/package.json",
      "config/**/*.{ts,json}",
      "test/{package,tsconfig,tsconfig.scripts}.json",
      "package.json",
      "pnpm-lock.yaml",
    ], { cwd: root }))].map((file) => ({
      path: file.replaceAll("\\", "/"),
      bytes: fs.readFileSync(path.join(root, file)),
    })),
    {
      path: "@runtime/node",
      bytes: Buffer.from(`${process.version}/${process.platform}/${process.arch}`),
    },
  ]),
});
const identity = snapshot(basis);
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
const rows = runBodyPoseDefectCensus({
  identity,
  snapshot,
  states,
  shapes: pick(options.shapes, shapeNames),
  poses: pick(options.poses, poseNames),
  indices: surface.indices,
  zoneOfVertex: (v) => zones[v],
  build: (document) => build(document).posedSurfaces[0].positions,
  progress: (shape, pose) => console.log(shape, pose),
});
const directory = path.join(root, ".shots/pose-defect-census");
fs.mkdirSync(directory, { recursive: true });
const table = formatBodyPoseDefectTable(rows);
fs.writeFileSync(path.join(directory, label + ".md"), table);
fs.writeFileSync(
  path.join(directory, label + ".json"),
  JSON.stringify(
    {
      basis: basis.id,
      basisPath,
      head: identity.head,
      identity,
      rows,
    },
    null,
    1,
  ),
);
console.log(table);
