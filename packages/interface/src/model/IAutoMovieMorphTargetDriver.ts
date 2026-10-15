import { IAutoMovieDrivenCurve } from "../core/IAutoMovieDrivenCurve";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Makes a morph target's weight follow one clinical joint angle, so a shape
 * that a bent or turned joint needs, such as a corrective, appears wherever the
 * pose is applied rather than only where its author posed the model.
 *
 * The engine reads the pose's angle for `bone` on `axis` in degrees, the value
 * an `IAutoMovieJointPose` carries; a bone the pose does not list, or a
 * null axis, reads zero, and a bone listed twice reads its last entry. The
 * weight is `curve` at that angle: piecewise linear between points, holding the
 * first and last outputs outside them, unclamped, so an output outside [0, 1]
 * under- or over-drives the target. The viewer writes the weight beside the
 * bone rotations whenever it applies a pose.
 *
 * @evidence contracts/common.md#principled-implementation One scalar joint angle mapped through a driven-key curve, the pose-space deformation of Lewis et al. 2000 restricted to one input; the angle is the authored clinical value, so it needs no forward kinematics and reads the same in the engine and the viewer.
 * @evidence contracts/common.md#clear-and-simple-design A bone, an axis and the existing {@link IAutoMovieDrivenCurve} reuse the clip driver's curve semantics instead of a second mapping type, and live on the target they drive.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission requires a skeleton bone, a known axis and a nonempty finite strictly increasing curve, and refuses a driven target whose name an expression also writes, so neither silently overwrites the other.
 * @evidence contracts/common.md#meaningful-documentation States the angle's source, unit and neutral reading, the duplicate-joint rule, the curve evaluation and extension, the unclamped weight and when the viewer applies it.
 * @author Samchon
 */
export interface IAutoMovieMorphTargetDriver {
  /** Skeleton bone whose joint angle drives the weight. */
  bone: AutoMovieHumanoidBone;

  /** Clinical axis read from that bone's joint pose, in degrees. */
  axis: "flexion" | "abduction" | "twist";

  /** Map from the angle in degrees to the target weight. */
  curve: IAutoMovieDrivenCurve;
}
