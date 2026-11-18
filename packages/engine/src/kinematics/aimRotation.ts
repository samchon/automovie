import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * IK families use the same turn. Representable nonzero cross products remain
 * active, subject to binary64 precision in the normalized directions and result.
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
 * @evidence contracts/development/implementation.md#principled-implementation The shortest arc between two unit vectors is the rotation about their cross product by `atan2(|a x b|, a . b)`, which `rotationBetween` computes without a near-parallel deadzone; normalizing first removes the magnitudes the angle does not depend on, and the documented zero-vector identity is `rotationBetween`'s degenerate branch rather than a separate rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct and prepare entries own named finite refusal and delegate every numerical turn to rotationBetween's same core; the prepared reader adds only lazy successful source admission/normalization for the two-bone workload.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite inputs retain named refusal, every target still validates, and no small angle is snapped. Preparation stores nothing until original source-then-target validation succeeds and requires an unchanged borrowed source; direct calls keep live reads.
 * @evidence contracts/development/common.md#meaningful-documentation States direction frames, unit rotation, collinear behavior and refusal; prepare's child documentation defines unchanged-source lifetime, lazy original-order admission, per-target checks and caller release.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct aiming checks six components and normalizes both directions. prepare checks/normalizes its fixed source once after successful first target admission; each later target retains three checks and the actual constant shortest-arc solve, with no measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only prepare's successful normalized source is shared under its explicit unchanged-source premise; target failure before that leaves the reader unprepared and retryable. No target, angle or rotation is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct temporaries end with the call. A prepared closure borrows its source and owns at most one normalized-source reader/vector until caller release, with no global collection, target history or handles.
 */
export function aimRotation(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  validateVector("from", from);
  validateVector("to", to);
  return rotationBetween(from, to);
}

/**
 * Lazy finite-admitted aiming from one unchanged source direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States lazy first-use source admission, unchanged-source lifetime and named refusal for every target.
 * @evidence contracts/development/design.md#principled-representation One fixed direction and changing target directions are the actual two-bone candidate workload; the same rotationBetween owner computes every actual shortest arc.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared reader serves twoBoneChainArticulation's source-fixed upper and local fore directions, with no target cache or second aim method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The direct entry retains all live reads; explicit preparation shares only successful source admission and normalization under the caller's unchanged-source premise.
 */
export namespace aimRotation {
  /**
   * Borrow an unchanged finite source until the returned reader is released.
   * Construction performs no admission. The first query validates source and
   * target in the direct entry's order, then prepares the normalized source.
   * Every later target still receives the same named finite checks and exact
   * shortest-arc solve. A changed source requires another reader.
   *
   * Source admission and normalization are independent of target after that
   * first success. Only their completed work is shared; no angle, target or
   * rotation is cached, and a failed validation leaves preparation retryable.
   * One closure and one normalized-source reader/vector belong to this
   * operation until caller release. Direct aiming keeps its live admission.
   */
  export function prepare(
    from: IAutoMovieVector3,
  ): (to: IAutoMovieVector3) => IAutoMovieQuaternion {
    let rotate: ReturnType<typeof rotationBetween.prepare> | undefined;
    return (to: IAutoMovieVector3): IAutoMovieQuaternion => {
      if (rotate === undefined) validateVector("from", from);
      validateVector("to", to);
      rotate ??= rotationBetween.prepare(from);
      return rotate(to);
    };
  }
}

/** Refuse a vector with a non-finite component, naming the argument and axis. */
const validateVector: (
  label: "from" | "to",
  value: IAutoMovieVector3,
) => void = (label: "from" | "to", value: IAutoMovieVector3): void => {
  for (const axis of VECTOR_AXES)
    if (!Number.isFinite(value[axis]))
      throw new Error(
        `aimRotation ${label}.${axis} must be finite, but was ${value[axis]}`,
      );
};
