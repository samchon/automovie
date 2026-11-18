import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/**
 * Face a hand against a target normal, keeping its fingers as near upright
 * as that normal allows. A vertical normal, which leaves no upright
 * direction in its plane, points the fingers along the performer's forward.
 *
 * @param side The hand whose anatomical axes are aligned.
 * @param normal The target's outward world normal.
 * @param yaw The performer's heading, degrees about +Y.
 * @returns The world hand rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target-normal direction, the upright finger rule, the forward fallback for a vertical normal, the heading's unit and the world quaternion returned.
 * @evidence contracts/development/implementation.md#principled-implementation Projects world up onto the plane normal to the normalized target normal; below `VERTICAL` of projected length the normal is vertical and the performer's forward, which lies in that plane, takes its place. HumanHand.rotation then aligns the hand's anatomical axes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the arm phrase's default facing apart from its transport and path plan; HumanHand remains the alignment owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fallback is the performer's own forward, not a world axis, so it turns with the body; no target or body is special-cased.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed vector work and one hand alignment, with no scan or algorithm choice.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm phrase calls it once per arm at plan time.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion and retains nothing.
 */
export function armPhraseFacing(
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
  yaw: number,
): IAutoMovieQuaternion {
  const n: IAutoMovieVector3 = Vector3.normalize(normal);
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const across: IAutoMovieVector3 = Vector3.subtract(up, Vector3.scale(n, Vector3.dot(up, n)));
  const fingers: IAutoMovieVector3 =
    Vector3.length(across) > VERTICAL
      ? across
      : HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 });
  return HumanHand.rotation(side, { fingers, palm: Vector3.scale(n, -1) });
}

/** The projected length of world up under which a normal counts as vertical: the sine of the angle between them, 1e-6 rad, a numeric guard far below any authored tilt. */
const VERTICAL: number = 1e-6;
