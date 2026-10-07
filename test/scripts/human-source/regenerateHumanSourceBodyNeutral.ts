import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import { evaluateHumanBodyLandmarks } from "@automovie/human/body/basis/evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "@automovie/human/body/basis/humanBodyBasisWeights";
import { resolveHumanBodySkeleton } from "@automovie/human/body/basis/resolveHumanBodySkeleton";
import type { IAutoMovieMesh } from "@automovie/interface";

import { createBodyCorrectiveWorld } from "../body-basis/createBodyCorrectiveWorld";
import { resolveBodyCrease, type IBodyContactWork } from "../body-basis/resolveBodyContactPair";
import type { IHumanSourceAuthoredSkin } from "./structures/IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";

/** Re-author the upstream neutral's overlapping toe sheets on the actual root.
 * The historical neutral-receipt's producer responsibility is replayed through
 * the existing contact rule and its source-conventional tissue budget. The
 * source's real rest joints, dominant-bone segments and adjacency define the
 * work; no normal model or posed fixture is constructed. The solver cannot
 * edit the frozen neck cut. Successful neutral displacement is authored onto
 * the one root, so both views and every later derivative use the same base.
 * Endpoint differences retain their source convention against that new rest;
 * this is no clinical tissue estimate, pose request or motion acceptance.
 */
export function regenerateHumanSourceBodyNeutral(
  original: IAutoMovieHumanBodyBasis,
  root: IHumanSourceCompactedTopology,
  skin: IHumanSourceAuthoredSkin,
): Record<string, unknown> {
  const cut = skin.partition.cut;
  const neutral: IAutoMovieMesh = { positions: Array.from(skin.bodyPositions), indices: Array.from(cut.p1BodyIndices), normals: null, uvs: null, skin: null };
  const before = measureAutoMovieMeshCrossings(neutral, neutral, { allPairs: true });
  const joints = original.surfaces[0].skin.joints;
  const boneIndices: number[] = [], weights: number[] = [];
  for (const support of skin.bodyBones) for (let slot = 0; slot < 4; slot++) {
    const row = support[slot];
    const index = row === undefined ? 0 : joints.indexOf(row[0] as (typeof joints)[number]);
    if (row !== undefined && index < 0) throw new Error(`Neutral source bone support ${row[0]} has no public slot.`);
    boneIndices.push(index); weights.push(row === undefined ? 0 : row[1]);
  }
  const basis: IAutoMovieHumanBodyBasis = { ...original,
    surfaces: [{ ...original.surfaces[0], positions: neutral.positions, indices: neutral.indices!,
      skin: { joints, boneIndices, weights } }] };
  const world = createBodyCorrectiveWorld(basis);
  const state = humanBodyBasisWeights(basis, { shape: {} });
  const rig = resolveHumanBodySkeleton(basis, evaluateHumanBodyLandmarks(basis, state));
  const work: IBodyContactWork = { segments: world.segments, near: world.near, parents: world.parents, dominant: world.dominant,
    bones: new Map(basis.joints.map((joint) => {
      const rest = rig.rest.get(joint.bone);
      if (rest === undefined) throw new Error(`Neutral source contact lacks actual ${joint.bone} rest frame.`);
      return [joint.bone, { position: rest.position, rotation: rest.rotation, length: world.lengths.get(joint.bone)!, parent: joint.parent }];
    })),
    base: neutral.positions, positions: neutral.positions.slice(), posed: new Map(), standing: new Map(), log: [] };
  const parts = new Set(before.flatMap((pair) => [pair.triangle, pair.other]).map((triangle) => {
    const corners = neutral.indices!.slice(3 * triangle, 3 * triangle + 3);
    const owner = corners.map(world.dominant);
    return owner[1] === owner[2] && owner[0] !== owner[1] ? owner[1] : owner[0];
  }));
  for (const part of parts) {
    if (part !== "leftToes" && part !== "rightToes") throw new Error(`Neutral source repair requires a separately owned non-toe crossing: ${part}.`);
    resolveBodyCrease(work, part);
  }
  const after = measureAutoMovieMeshCrossings({ ...neutral, positions: work.positions }, { ...neutral, positions: work.positions }, { allPairs: true });
  if (after.length !== 0) throw new Error(`Neutral toe source contact rule left ${after.length} exact crossing pairs; root not replaced.`);
  let maximumMetres = 0;
  const rows: number[][] = [];
  for (const [vertex, delta] of work.posed) {
    const source = cut.p1BodyToG1[vertex];
    if (source >= root.topology.vertexCount) throw new Error("Neutral toe source repair attempted to move the frozen neck stencil.");
    maximumMetres = Math.max(maximumMetres, Math.hypot(...delta));
    rows.push([root.sourceToNative[source], ...delta]);
    for (let axis = 0; axis < 3; axis++) {
      const value = work.positions[3 * vertex + axis];
      root.topology.positions[3 * source + axis] = value;
      skin.positions[3 * source + axis] = value;
    }
  }
  const pick = (samples: Int32Array): Float64Array => Float64Array.from(Array.from(samples).flatMap((vertex) => Array.from(skin.positions.subarray(3 * vertex, 3 * vertex + 3))));
  skin.bodyPositions = pick(cut.p1BodyToG1);
  skin.headPositions = pick(cut.faceToG1);
  return { revision: "source-neutral-contact-1", method: "existing source contact rule on actual rest toe sheets and its conventional budget",
    originalPublication: "test/studies/human-body/connected-basis/neutral-receipt.json", beforePairs: before.length, afterPairs: after.length,
    moved: rows.length, maximumMetres, nativeDisplacementsMetres: rows.sort((a, b) => a[0] - b[0]), log: work.log,
    frame: "canonical source metres,+Xleft,+Yup,+Zanterior", qualification: "Authored upstream neutral toe separation; no clinical dimensions, normal model admission or motion acceptance." };
}
