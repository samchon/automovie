import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A pose's velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Joint triples are clinical degrees per second, spins are articulation-frame radians per second and root rates use the pose's parent frame in metres or radians per second. The closed side union chooses a before, after or centred stencil; samplePoseVelocity owns sampling admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMoviePoseVelocity keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
 * @evidence contracts/development/design.md#principled-representation Joint triples are clinical degrees per second, spins are articulation-frame radians per second and root rates use the pose's parent frame in metres or radians per second. The closed side union chooses a before, after or centred stencil; samplePoseVelocity owns sampling admission. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePoseVelocity contract belongs to interface; packages/engine/src/motion/samplePoseVelocity.ts and packages/engine/src/motion/inertializePose.ts use this boundary. Runtime computation remains with those consumers.
 */
export interface IAutoMoviePoseVelocity {
  /** Flexion, abduction and twist rates per bone, degrees per second. */
  joints: Map<AutoMovieHumanoidBone, [number, number, number]>;

  /**
   * Each joint's angular velocity, radians per second, in the frame its
   * articulation is applied in (after the bone's rest rotation).
   */
  spins: Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

  /** Root translation rate, metres per second, the pose's parent frame. */
  linear: IAutoMovieVector3;

  /** Root angular velocity, radians per second, the pose's parent frame. */
  angular: IAutoMovieVector3;
}
