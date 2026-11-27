import type { IAutoMovieHingedArmSpan } from "../pose/IAutoMovieHingedArmSpan";
import type { IAutoMovieJointRotationDomain } from "../pose/IAutoMovieJointRotationDomain";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePrepareChainFit } from "./IAutoMoviePrepareChainFit";

/**
 * Contracts of `prepareChainRigConstants`: the rig readers one prepared chain
 * keeps.
 */
export namespace IAutoMoviePrepareChainRigConstants {
  /** Pose-independent records fixed by the prepared chain's rig. */
  export interface IFixed {
    /** The effective root joint domain. */
    upperDomain: IAutoMovieJointRotationDomain;

    /** The effective mid-joint domain. */
    lowerDomain: IAutoMovieJointRotationDomain;

    /** The effector's rest orientation with its own joint removed. */
    effectorBaseRotation: IAutoMovieQuaternion;

    /** The root-to-mid rest offset, in the root's local frame. */
    lowerOffset: IAutoMovieVector3;

    /** The mid-joint rest orientation relative to the root. */
    lowerRotation: IAutoMovieQuaternion;

    /** The mid-to-effector rest offset, in the mid's local frame. */
    effectorOffset: IAutoMovieVector3;
  }

  /**
   * The rig-only readers of `IAutoMoviePrepareChainFit.IRig` and the fixed
   * hinge span.
   */
  export interface IRig extends Pick<
    IAutoMoviePrepareChainFit.IRig,
    | "bone"
    | "domain"
    | "basis"
    | "jointBasis"
    | "composer"
    | "clamp"
    | "overshoot"
    | "rotatedOvershoot"
    | "effectorProjection"
    | "effectorRestInverse"
    | "distalTwist"
    | "hingeRange"
    | "upperRange"
  > {
    /**
     * The hinge's span coefficients prepared from the chain's rest records for
     * all its posed sources (`hingedArmSwivel.prepare`).
     */
    span: IAutoMovieHingedArmSpan.ISpan;
  }
}
