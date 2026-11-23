import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { rotationBetween } from "../math/rotationBetween";

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
 * Inputs are validated as finite, normalized, and passed to the engine's single
 * shortest-arc primitive {@link rotationBetween}, the same deadzone-free `atan2`
 * helper the world-driver IK path uses, so the analytic and iterative IK
 * families use the same turn. Representable nonzero cross products remain
 * active, subject to binary64 precision in the normalized directions and
 * result.
 *
 * Aligned inputs return the identity, and antiparallel inputs a 180 degree turn
 * about a deterministic perpendicular. A zero-length input has no direction and
 * also returns the identity, which keeps a projectile at rest facing its
 * authored forward axis.
 *
 * @param from Direction to turn, any finite length.
 * @param to Direction to turn onto, any finite length.
 * @returns A unit quaternion.
 * @throws Error naming the vector and component when a component is not finite.
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

/**
 * Refuse a vector with a non-finite component, naming the argument and axis, in
 * `x`, `y`, `z` order. The three components are read directly, so an admitted
 * vector costs three tests and builds nothing.
 */
const validateVector: (
  label: "from" | "to",
  value: IAutoMovieVector3,
) => void = (label: "from" | "to", value: IAutoMovieVector3): void => {
  if (!Number.isFinite(value.x)) refuse(label, "x", value.x);
  if (!Number.isFinite(value.y)) refuse(label, "y", value.y);
  if (!Number.isFinite(value.z)) refuse(label, "z", value.z);
};

/** Throw the named refusal of one non-finite component. */
const refuse: (
  label: "from" | "to",
  axis: VectorAxis,
  value: number,
) => never = (label: "from" | "to", axis: VectorAxis, value: number): never => {
  throw new Error(
    `aimRotation ${label}.${axis} must be finite, but was ${value}`,
  );
};

/** A vector component's name. */
type VectorAxis = "x" | "y" | "z";
