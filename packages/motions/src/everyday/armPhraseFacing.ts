import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * Face a hand against a target normal, keeping its fingers as near upright
 * as that normal allows. A vertical normal keeps the existing +Z fallback.
 *
 * @param side The hand whose anatomical axes are aligned.
 * @param normal The target's outward world normal.
 * @returns The same world hand rotation used by the arm phrase's fixed target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines target-normal direction, upright finger policy, world quaternion output and inherited vertical fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Projects world up onto the plane normal to the normalized target normal, then delegates the anatomical hand alignment to HumanHand.rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the phrase's default facing policy separately from its transport/path plan; HumanHand remains the alignment owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing 1e-6 projection threshold and +Z fallback, normalization and expression order without adding a target or body exception.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed vector work and one existing hand alignment, with no scan or algorithm choice.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm phrase evaluates this fixed target rotation once at plan construction; changing a normal still computes its actual alignment.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion and retains no target, normal, body or frame.
 */
export function armPhraseFacing(
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const n: IAutoMovieVector3 = Vector3.normalize(normal);
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const across: IAutoMovieVector3 = Vector3.subtract(up, Vector3.scale(n, Vector3.dot(up, n)));
  const fingers: IAutoMovieVector3 =
    Vector3.length(across) > 1e-6 ? across : { x: 0, y: 0, z: 1 };
  return HumanHand.rotation(side, { fingers, palm: Vector3.scale(n, -1) });
}
