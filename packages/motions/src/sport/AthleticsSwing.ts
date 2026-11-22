import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A swinging foot's path over a barrier: the ankle leaves one placement,
 * passes a stated placement at the path's middle and reaches another, the
 * ankle on a quadratic Bezier curve timed by minimum-jerk progress, the foot
 * turning on the shortest arc to the middle's rotation and then to the last.
 *
 * The middle placement is the one the barrier asks for (a hurdle's bar, a
 * vaulting table's edge), so its clearance is exact at that instant rather
 * than read off a lift profile. The Bezier's control point `2 over - (from +
 * to) / 2` puts the curve through the middle ankle at progress one half.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, its timing and why its middle is exact.
 * @evidence contracts/development/design.md#principled-representation World-metre ankle points and unit quaternion foot rotations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The path record and its one preparation, read by the hurdle clearance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The middle placement is the caller's measured barrier placement, never a tuned lift.
 */
export namespace AthleticsSwing {
  /**
   * A swing's three places.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame.
   * @evidence contracts/development/design.md#principled-representation Three foot placements, world-metre ankles and unit quaternions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The departure, the barrier placement and the arrival.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No timing is stored: the caller maps its seconds to progress.
   */
  export interface IPath {
    /** The placement the swing leaves. */
    from: IAutoMovieMotionHumanFoot.IPlacement;

    /** The placement the swing passes at its middle: the ankle there and the foot's rotation. */
    over: IAutoMovieMotionHumanFoot.IPlacement;

    /** The placement the swing reaches. */
    to: IAutoMovieMotionHumanFoot.IPlacement;
  }

  /**
   * Prepare a swing's placement by progress.
   *
   * @param path The swing.
   * @returns The placement at a progress in [0, 1], clamped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the output and the clamping.
   * @evidence contracts/development/implementation.md#principled-implementation A quadratic Bezier through its middle point on minimum-jerk progress (Flash and Hogan 1985), the rotation slerped on the same progress through the middle placement's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One control point, then a closed-form sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Progress outside [0, 1] is clamped to the ends, where the swing stands still.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The control point is computed once per path.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the path's three places and one control point.
   */
  export function prepare(
    path: IPath,
  ): (progress: number) => IAutoMovieMotionHumanFoot.IPlacement {
    const control: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(path.over.ankle, 2),
      Vector3.scale(Vector3.add(path.from.ankle, path.to.ankle), 0.5),
    );
    return (progress: number): IAutoMovieMotionHumanFoot.IPlacement => {
      const s: number = minimumJerk.share(Math.min(1, Math.max(0, progress)));
      const a: number = (1 - s) * (1 - s);
      const b: number = 2 * s * (1 - s);
      const c: number = s * s;
      return {
        ankle: {
          x: a * path.from.ankle.x + b * control.x + c * path.to.ankle.x,
          y: a * path.from.ankle.y + b * control.y + c * path.to.ankle.y,
          z: a * path.from.ankle.z + b * control.z + c * path.to.ankle.z,
        },
        rotation:
          s <= 0.5
            ? Quaternion.slerp(path.from.rotation, path.over.rotation, 2 * s)
            : Quaternion.slerp(path.over.rotation, path.to.rotation, 2 * s - 1),
      };
    };
  }
}
