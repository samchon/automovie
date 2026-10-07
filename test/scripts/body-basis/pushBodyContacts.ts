import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";

import type { BodyBoneFrames } from "./BodyBoneFrames";
import type { BodyContactBones } from "./BodyContactBones";
import type { IBodyContactPush } from "./IBodyContactPush";
import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";
import { blendBodyVertices } from "./blendBodyVertices";
import { carryToPosed } from "./carryToPosed";
import { carryToRest } from "./carryToRest";
import {
  type IBodyContactWork,
  resolveBodyCrease,
  resolveBodyPair,
} from "./resolveBodyContactPair";
import { segmentBodyPositions } from "./segmentBodyPositions";

/** Sweeps over a state's crossing pairs before the solve is handed back. */
const SWEEPS = 5;

/**
 * Push the crossing segments of one posed body apart and carry the result to
 * the rest frame.
 *
 * The posed skin is the one `built` holds, in basis vertex order. `previous`
 * rest rows (an earlier pass at the same state) are carried into the posed
 * frame as the starting displacement. Up to five sweeps read the crossing
 * pairs of the segments and resolve each: a segment through itself as a crease
 * (`resolveBodyCrease`), any other pair by the best-of contact solver
 * (`resolveBodyPair`). The posed displacements are then carried to the rest
 * frame through the transposed rotation of each vertex's dual quaternion blend
 * (`carryToRest`), exact for the skinning the builder uses. The caller
 * verifies the candidate through the public builder, which is what decides
 * whether the carried rows still clear the crossing.
 *
 * Positions the builder returns are metres in the body's Y-up, Z-forward
 * frame. Nothing here mutates `built` or the basis.
 */
export function pushBodyContacts(
  world: IBodyCorrectiveWorld,
  basis: IAutoMovieHumanBodyBasis,
  built: IAutoMovieHumanBodyBuild,
  previous: Map<number, number[]> | null,
): IBodyContactPush {
  const base = built.posedSurfaces[0].positions.slice();
  const frames: BodyBoneFrames = new Map(
    built.bones.map((bone) => [
      bone.bone,
      { rest: bone.rest, posed: bone.posed },
    ]),
  );
  const blends = blendBodyVertices(
    world.surface.skin,
    frames,
    world.vertices,
    basis.joints,
  );
  const bones: BodyContactBones = new Map(
    built.bones.map((bone) => [
      bone.bone,
      {
        position: bone.posed.position,
        rotation: bone.posed.rotation,
        length: world.lengths.get(bone.bone)!,
        parent: world.parents.get(bone.bone) ?? null,
      },
    ]),
  );
  const work: IBodyContactWork = {
    segments: world.segments,
    near: world.near,
    parents: world.parents,
    dominant: world.dominant,
    bones,
    base,
    positions: base.slice(),
    posed: new Map(),
    standing: new Map(),
    log: [],
  };
  if (previous !== null)
    for (const [v, d] of previous) {
      const dp = carryToPosed(blends[v].rotation, d);
      for (let k = 0; k < 3; k++) work.positions[v * 3 + k] += dp[k];
      work.posed.set(v, dp);
    }
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    const pairs = measureAutoMovieModelCrossings(
      segmentBodyPositions(world, work.positions).model,
      { withinParts: true },
    );
    if (pairs.length === 0) break;
    for (const pair of pairs)
      if (pair.part === pair.other) resolveBodyCrease(work, pair.part);
      else resolveBodyPair(work, pair.part, pair.other);
  }
  const rest = new Map<number, number[]>();
  for (const [v, d] of work.posed)
    rest.set(v, carryToRest(blends[v].rotation, d));
  return { rest, posed: work.posed, log: work.log };
}
