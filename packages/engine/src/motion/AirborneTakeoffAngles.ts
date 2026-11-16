import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { solveAirborneTakeoff } from "./solveAirborneTakeoff";

/** The lateral unit axis, read without mutation by quaternion operations. */
const LATERAL: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/** The longitudinal unit axis in the shooting attitude convention. */
const LONGITUDINAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The forward unit axis in the shooting attitude convention. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The shooting attitude angles from an already inverted reference frame.
 *
 * For M = into q = Rx(phi) Rz(theta) Ry(psi), the long axis gives tilt
 * and somersault. Turning the lateral axis back through Rx(phi) Rz(theta)
 * gives twist. Somersault and twist are principal angles; tilt lies in
 * [-pi/2, pi/2]. This is the existing takeoff chart, with its original
 * clamped asin and its Euler-chart singularity.
 *
 * @param into The inverse of the unit reference orientation.
 * @param q The unit body orientation in the reference's parent coordinates.
 * @returns Principal somersault, tilt and twist angles, radians.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inverse-frame input, quaternion convention, chart factorization, radian outputs and principal branches.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the long axis of M to obtain theta and phi, then the lateral axis after undoing Rx(phi) Rz(theta) to obtain psi. Unit input orientations and the shooting solver's existing chart are the premises; chart singularity is retained.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Form the relative orientation, read two long-axis angles, undo those two turns and read the lateral-axis twist.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moves the existing arithmetic into one owner, retaining its asin clamp and atan2 branches without a new tolerance, normalization or alternative attitude chart.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per orientation. A flight's repeated reads supply one precomputed reference inverse, and three fixed basis records replace four axis literals per read. No wall-time speedup is inferred from these source-level work and allocation removals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The public single-angle wrapper and the flight's unwrapping loop share this calculation. The caller's unchanged inverse reference frame is reused across orientations; quaternion rotation and axis-angle construction only read the three private unit axes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Three fixed unit-axis records live with the module. All computed quaternion/vector temporaries are call-local; only three numeric angles escape, with no input mutation, computed-value cache, callback or handle.
 */
export function AirborneTakeoffAngles(
  into: IAutoMovieQuaternion,
  q: IAutoMovieQuaternion,
): solveAirborneTakeoff.IAngles {
  const m: IAutoMovieQuaternion = Quaternion.multiply(into, q);
  const long: IAutoMovieVector3 = Quaternion.rotateVector(m, LONGITUDINAL);
  const tilt: number = -Math.asin(Math.max(-1, Math.min(1, long.x)));
  const somersault: number = Math.atan2(long.z, long.y);
  const degrees: number = 180 / Math.PI;
  const back: IAutoMovieQuaternion = Quaternion.inverse(
    Quaternion.multiply(
      Quaternion.fromAxisAngle(LATERAL, somersault * degrees),
      Quaternion.fromAxisAngle(FORWARD, tilt * degrees),
    ),
  );
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(back, m),
    LATERAL,
  );
  return { somersault, tilt, twist: Math.atan2(-lateral.z, lateral.x) };
}
