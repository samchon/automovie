import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A swinging foot's path over a barrier: the ankle leaves one placement, passes
 * a stated placement at the path's middle and reaches another, the ankle on a
 * quadratic Bezier curve timed by minimum-jerk progress, the foot turning on
 * the shortest arc to the middle's rotation and then to the last.
 *
 * The middle placement is the one the barrier asks for (a hurdle's bar, a
 * vaulting table's edge), so its clearance is exact at that instant rather than
 * read off a lift profile. The Bezier's control point `2 over - (from + to) /
 * 2` puts the curve through the middle ankle at progress one half.
 */
export namespace AthleticsSwing {
  /** A swing's three places. */
  export interface IPath {
    /** The placement the swing leaves. */
    from: IAutoMovieMotionHumanFoot.IPlacement;

    /**
     * The placement the swing passes at its middle: the ankle there and the
     * foot's rotation.
     */
    over: IAutoMovieMotionHumanFoot.IPlacement;

    /** The placement the swing reaches. */
    to: IAutoMovieMotionHumanFoot.IPlacement;
  }

  /**
   * Prepare a swing's placement by progress.
   *
   * @param path The swing.
   * @returns The placement at a progress in [0, 1], clamped.
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
