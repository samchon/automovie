import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A validating front for the one shared shortest-arc primitive, so every aim, light, projectile and two-bone caller turns vectors the same way while non-finite input is refused with the aim's own message.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-finite components are refused rather than replaced, and no tolerance snaps a small angle to the identity.
 * @evidence contracts/development/common.md#meaningful-documentation States its uses and how to call it for aiming, the shared primitive and why that matters, the aligned, antiparallel and zero-length results, and the refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six input finiteness checks precede the shared constant-time shortest-arc computation; direction normalization occurs only in rotationBetween.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two vectors; callers that need it per frame or per candidate pass different vectors each time.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns no temporary vectors or persistent state; the delegated computation's bounded direction and quaternion records leave no references here.
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
   * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged borrowed source, lazy original-order finite admission, per-target refusal and operation release.
   * @evidence contracts/development/implementation.md#principled-implementation Source finiteness/normalization are target-independent and successfully prepared only after both original vector validations; rotationBetween.prepare owns the same normalized-direction turn core as direct aiming.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This validating adapter owns named input refusal and delegates every numerical turn to the shared shortest-arc primitive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failed source or target admission stores no reader, and no zero/small-angle branch, threshold or target answer changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One successful source validation/normalization serves all candidates; each query retains three target checks and the actual constant shortest-arc work. No speedup is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the unchanged source's completed admission/normalized value are shared, and target failure before first preparation remains retryable.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One closure owns the borrowed source and at most one prepared shortest-arc closure/vector until caller release, with no target history, global state or handles.
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
