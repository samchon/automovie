import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieProjectileFirstContact,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Continuously bounded poses of one rigid actor part for the projectile
 * departure certificate. Each part of a composed actor gets its own pose, so
 * every part stays a separate collider on the same launch clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-part ownership, launch clock and exact bound of each pose.
 * @evidence contracts/development/design.md#principled-representation A constant world velocity and a constant spin about a fixed unit axis have exact closed-form bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies the two pose producers that Engine regressions and the moving-performer consumer of #3827 share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds come from the declared motion, never from sampled pose differences.
 */
export namespace ProjectileMovingPartFixture {
  /**
   * Declared motion of one rigid part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names units, the clock origin and the optional conservative spin bound.
   * @evidence contracts/development/design.md#principled-representation Every member describes one closed-form rigid motion in world metres and radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members a constant rigid motion needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An omitted member is the stationary value, not an unknown motion.
   */
  export interface IMotion {
    /** Parent origin at the start second, world metres. Default zero. */
    origin?: IAutoMovieVector3;
    /** Constant world velocity of the parent origin, metres per second. Default zero. */
    velocity?: IAutoMovieVector3;
    /** Unit world axis of the constant spin. Default world up. */
    axis?: IAutoMovieVector3;
    /** Signed spin about the axis, radians per second. Default zero. */
    angularVelocity?: number;
    /** Declared angular-speed bound, radians per second; at least the spin. Default the spin's magnitude. */
    angularBound?: number;
    /** Launch-relative second at which the part is at its origin. Default zero. */
    start?: number;
  }

  /**
   * Build the continuous pose of one rigid part from its declared motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the closed-form path and the bound it declares for every prefix.
   * @evidence contracts/development/implementation.md#principled-implementation Integrates constant velocity and spin exactly; the bound repeats the declared velocity and spin with zero velocity error.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose reader and one bound reader over the same defaults.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A spin bound below the actual spin refuses with RangeError instead of declaring a false bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the Engine quaternion owner for the rotation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the declared motion constants.
   */
  export function part(
    motion: IMotion = {},
  ): IAutoMovieProjectileFirstContact.IContinuousPose {
    const origin: IAutoMovieVector3 = motion.origin ?? ZERO;
    const velocity: IAutoMovieVector3 = motion.velocity ?? ZERO;
    const axis: IAutoMovieVector3 = motion.axis ?? UP;
    const spin: number = motion.angularVelocity ?? 0;
    const bound: number = motion.angularBound ?? Math.abs(spin);
    const start: number = motion.start ?? 0;
    if (!(bound >= Math.abs(spin)))
      throw new RangeError("The angular bound must cover the actual spin.");
    return {
      at: (seconds: number): IAutoMovieRigidTransform => {
        const elapsed: number = seconds - start;
        return {
          position: {
            x: origin.x + velocity.x * elapsed,
            y: origin.y + velocity.y * elapsed,
            z: origin.z + velocity.z * elapsed,
          },
          rotation:
            spin === 0
              ? AutoMovieEngineQuaternion.identity()
              : AutoMovieEngineQuaternion.fromAxisAngle(
                  axis,
                  (spin * elapsed * 180) / Math.PI,
                ),
        };
      },
      bound: (
        _from: number,
        to: number,
      ): IAutoMovieProjectileFirstContact.IMotionBound => ({
        to,
        referenceVelocity: velocity,
        velocityError: 0,
        angularSpeed: bound,
      }),
    };
  }

  /**
   * Vertical translation used by the tangent-sphere oracle of #3929.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the speed, direction and clock origin.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `part` with a pure upward velocity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no motion beyond the declared translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `part`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains two numbers through `part`.
   */
  export function rising(
    speed: number,
    start: number = 0,
  ): IAutoMovieProjectileFirstContact.IContinuousPose {
    return part({ velocity: { x: 0, y: speed, z: 0 }, start });
  }
}

const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
