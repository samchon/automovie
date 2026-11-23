import {
  type AutoMovieClinicalAxis,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  type IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";

/**
 * Convert a joint's clinical flexion, abduction and twist, in degrees, into one
 * bone-local rotation quaternion.
 *
 * Flexion turns about `axes.flexion` (default local X, sagittal), abduction
 * about `axes.abduction` (default Z, frontal) and twist about `axes.twist`
 * (default Y, the bone's long axis). The composition follows
 * `axes.twistPlacement`. A proximal twist, the default, turns the swing axes
 * with it, as the head turns below its nodding joint:
 *
 *     q = qTwist · qAbduction · qFlexion
 *
 * A distal twist turns the moved segment about its own long axis before the
 * swing, as the forearm pronates beyond the elbow, so a pose without twist is
 * the same rotation in either placement:
 *
 *     q = qAbduction · qFlexion · qTwist
 *
 * A declared flexion-abduction-twist order takes precedence over twist
 * placement and uses the rig's clinical vectors in the ISB hip sequence
 * (https://www.isbweb.org/standards/hip.pdf, Hip Order of Rotation):
 *
 *     q = qFlexion · qAbduction · qTwist
 *
 * `axes` lets a rig whose bone frames are not aligned to the clinical planes
 * keep flexion sagittal, such as a T-pose arm that needs flexion about Y. A
 * `null` angle contributes no rotation. With a `frame`, each angle is read as
 * clinical and mapped to the rig's rest-relative angle, `r = (clinical −
 * neutral) / sign`, so one clinical convention serves both sides of a mirrored
 * rig. {@link decomposeJointRotation} is the inverse for the same `axes` and
 * `frame`.
 *
 * Throws on a non-finite angle, an invalid axis basis (see
 * {@link normalizeJointAxes}), or an invalid frame sign or neutral.
 *
 * @param joint Clinical angles in degrees; `null` axes are at rest.
 * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
 * @param frame Rest frame mapping clinical angles to rest-relative ones;
 *   omitted, the angles are already rest-relative.
 */
export const jointToQuaternion: (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes?: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame | undefined,
) => IAutoMovieQuaternion = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion =>
  jointToQuaternionOnBasis(
    joint,
    normalizeJointAxes(axes, "jointToQuaternion axes"),
    frame,
  );
