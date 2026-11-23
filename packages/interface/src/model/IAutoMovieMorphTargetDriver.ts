import type { IAutoMovieDrivenCurve } from "../core/IAutoMovieDrivenCurve";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Makes a morph target's weight follow one clinical joint angle, so a shape
 * that a bent or turned joint needs, such as a corrective, appears wherever the
 * pose is applied rather than only where its author posed the model.
 *
 * The engine reads the pose's angle for `bone` on `axis` in degrees, the value
 * an `IAutoMovieJointPose` carries; a bone the pose does not list, or a null
 * axis, reads zero, and a bone listed twice reads its last entry. The weight is
 * `curve` at that angle: piecewise linear between points, holding the first and
 * last outputs outside them, unclamped, so an output outside [0, 1] under- or
 * over-drives the target. The viewer writes the weight beside the bone
 * rotations whenever it applies a pose.
 */
export interface IAutoMovieMorphTargetDriver {
  /** Skeleton bone whose joint angle drives the weight. */
  bone: AutoMovieHumanoidBone;

  /** Clinical axis read from that bone's joint pose, in degrees. */
  axis: "flexion" | "abduction" | "twist";

  /** Map from the angle in degrees to the target weight. */
  curve: IAutoMovieDrivenCurve;
}
