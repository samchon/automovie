import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Frames and clinical joint inputs for distributing a requested effector rotation onto a distal-twist mid joint. */
export namespace IAutoMovieSolveDistalTwist {
  /**
 * The twist a distally twisting mid bone (a forearm, which pronates and
 * supinates about its own length beyond the elbow's hinge) takes so its
 * effector (a wrist, which flexes and deviates but cannot twist) can reach a
 * requested rotation.
 *
 * The effector reads its rotation as clinical angles in its own Euler
 * convention, and the share it cannot take is that convention's twist. The
 * mid bone's twist composes last in its own articulation, `A = Abd Flex
 * T(u, r)`, so the effector's local rotation is `rest^-1 T(u, -r) K` with `K`
 * fixed by the pose above and the request. The effector's rig twist is
 * `atan2(P, Q)` of two components of that rotation applied to its flexion
 * (and, for a distal effector, abduction) axis (`decomposeJointRotationOnBasis`),
 * and each component of a vector turned about `u` by `-r` is
 * `alpha + beta cos r + gamma sin r`. Asking the effector's twist to stand at
 * its clinical zero is therefore one equation `A + B cos r + C sin r = 0`,
 * solved in closed form: at most two forearm twists, the circle the hand
 * turns on as the forearm twists crossing the rotations the wrist's two
 * angles make. Of those inside the forearm's range, the range's two ends and
 * the start, the one whose effector, clamped to its own range, shows the
 * request most nearly is taken, and between equals the one nearest the
 * start: the current twist plus the swing-twist share (`swingTwist`) of the
 * change from the effector's current rotation to the requested one. So only
 * the residual beyond the current pose moves, a request near the current
 * hand rotation moves the forearm little, and a rotation the two joints can
 * reach together is reached exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines pre-articulation world orientation, local rest/basis frames, clinical inputs and clamp lifetime.
 * @evidence contracts/development/design.md#principled-representation Clinical angles are degrees; bases are pre-normalized and world/rest quaternions unit. The caller admits those frames and effective ROM projectors own clamping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface splitDistalTwist and fitHingedRotationError supply this request to solveDistalTwist, reusing precomputed clamps during candidate scoring.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional clamps replace repeated skeleton lookup without importing runtime clamp implementations into interface.
 */
  export type IProps = {
    /** Current mid-joint articulation in clinical degrees; the solve changes its twist and preserves its other coordinates before clamping. */
    joint: IAutoMovieJointPose;
    /** Current effector articulation in clinical degrees, used to choose the nearby twist branch and its clamp. */
    effector: IAutoMovieJointPose;
    /** Unit world rotation immediately before the mid joint's articulation: resolved mid world rotation times inverse current articulation. */
    above: IAutoMovieQuaternion;
    /** Already normalized mid-joint clinical basis; intended for a distal twist such as forearm pronation. */
    lowerBasis: IAutoMovieJointAxes;
    /** Mid-joint clinical-to-rig angle frame; undefined leaves its angles rest-relative. */
    lowerFrame: IAutoMovieRestFrame | undefined;
    /** Unit rest rotation from the mid bone to the effector bone, composed before the effector articulation. */
    effectorRest: IAutoMovieQuaternion;
    /** Already normalized effector clinical basis used to measure its rotation residual. */
    effectorBasis: IAutoMovieJointAxes;
    /** Effector clinical-to-rig angle frame; undefined leaves its angles rest-relative. */
    effectorFrame: IAutoMovieRestFrame | undefined;
    /** Requested effector world orientation, unit quaternion in the same world frame as above. */
    rotation: IAutoMovieQuaternion;
    /** Skeleton supplying effective ROM when the corresponding precomputed clamp is absent. */
    skeleton: IAutoMovieSkeleton;
    /** Optional reusable ROM projectors. Called synchronously and repeatedly, never retained; must return the same bone in clinical degrees without mutating the argument. Exceptions propagate. Omission constructs both projectors from skeleton. */
    clamps?: {
      /** Projects the trial mid joint onto its effective ROM; extreme trial twists also establish the allowed search interval. */
      lower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
      /** Projects the trial effector onto its effective ROM before measuring orientation error. */
      effector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
    };
  };
}
