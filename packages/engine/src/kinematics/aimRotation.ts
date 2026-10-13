import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { rotationBetween } from "../math/rotationBetween";

/** Components checked for finiteness, in message order. */
const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"];

/**
 * The shortest-arc rotation that turns the direction of `from` onto the
 * direction of `to`.
 *
 * It is the core of an aim or look-at driver, such as a light aimed along its
 * direction or a projectile turned along its velocity, and of the analytic
 * two-bone solves (`twoBoneChainArticulation`, `hingedArmArticulation`). Pass
 * the bone's rest forward axis as `from` and `target - bonePosition` as `to`,
 * and the result orients the bone at the target.
 *
 * Inputs are validated as finite, normalized, and passed to the engine's
 * single shortest-arc primitive {@link rotationBetween}, the same deadzone-free
 * `atan2` helper the world-driver IK path uses, so the analytic and iterative
 * IK families cannot disagree. Every angle down to numerical zero produces its
 * exact rotation, so a target a fraction of a degree off-axis is tracked
 * exactly instead of snapped to the identity.
 *
 * Aligned inputs return the identity, and antiparallel inputs a 180 degree
 * turn about a deterministic perpendicular. A zero-length input has no
 * direction and also returns the identity, which keeps a projectile at rest
 * facing its authored forward axis.
 *
 * @param from Direction to turn, any finite length.
 * @param to Direction to turn onto, any finite length.
 * @returns A unit quaternion.
 * @throws Error naming the vector and component when a component is not finite.
 *
 * @evidence contracts/common.md#principled-implementation The shortest arc between two unit vectors is the rotation about their cross product by `atan2(|a x b|, a . b)`, which `rotationBetween` computes without a near-parallel deadzone; normalizing first removes the magnitudes the angle does not depend on, and the documented zero-vector identity is `rotationBetween`'s degenerate branch rather than a separate rule.
 * @evidence contracts/common.md#clear-and-simple-design A validating front for the one shared shortest-arc primitive, so every aim, light, projectile and two-bone caller turns vectors the same way while non-finite input is refused with the aim's own message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite components are refused rather than replaced, and no tolerance snaps a small angle to the identity.
 * @evidence contracts/common.md#meaningful-documentation States its uses and how to call it for aiming, the shared primitive and why that matters, the aligned, antiparallel and zero-length results, and the refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time: six finiteness checks, two normalizations and one cross product, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two vectors; callers that need it per frame or per candidate pass different vectors each time.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates two normalized vectors and the result, and retains nothing.
 * @author Samchon
 */
export const aimRotation = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  validateVector("from", from);
  validateVector("to", to);
  return rotationBetween(Vector3.normalize(from), Vector3.normalize(to));
};

/** Refuse a vector with a non-finite component, naming the argument and axis. */
const validateVector = (
  label: "from" | "to",
  value: IAutoMovieVector3,
): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(value[axis]))
      throw new Error(
        `aimRotation ${label}.${axis} must be finite, but was ${value[axis]}`,
      );
};
