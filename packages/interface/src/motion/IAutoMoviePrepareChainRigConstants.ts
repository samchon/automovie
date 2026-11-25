import type { IAutoMovieHingedArmSpan } from "../pose/IAutoMovieHingedArmSpan";
import type { IAutoMoviePrepareChainFit } from "./IAutoMoviePrepareChainFit";

/**
 * Contracts of `prepareChainRigConstants`: the rig readers one prepared chain
 * keeps.
 */
export namespace IAutoMoviePrepareChainRigConstants {
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
