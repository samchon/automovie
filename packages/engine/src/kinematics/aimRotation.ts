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
 * The direction of each input is normalized and passed to the engine's single
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
 * @param from Direction to turn, any length.
 * @param to Direction to turn onto, any length.
 * @returns A unit quaternion.
 */
export function aimRotation(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  return rotationBetween(from, to);
}

/** Aiming from one unchanged source direction. */
export namespace aimRotation {
  /**
   * Prepare the normalized source once and return the reader that turns it onto
   * each target by the exact shortest-arc solve. A changed source requires
   * another reader.
   */
  export function prepare(
    from: IAutoMovieVector3,
  ): (to: IAutoMovieVector3) => IAutoMovieQuaternion {
    return rotationBetween.prepare(from);
  }
}
