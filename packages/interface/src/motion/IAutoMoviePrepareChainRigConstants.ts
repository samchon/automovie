import type { IAutoMovieHingedArmSpan } from "../pose/IAutoMovieHingedArmSpan";
import type { IAutoMoviePrepareChainFit } from "./IAutoMoviePrepareChainFit";

/**
 * Contracts of `prepareChainRigConstants`: the rig readers one prepared chain
 * keeps.
 */
export namespace IAutoMoviePrepareChainRigConstants {
  /**
   * The rig-only readers of `IAutoMoviePrepareChainFit.IRig` and the hinge span
   * holder.
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
     * The hinge's span coefficients, read at the first branch query and shared
     * by every source of this chain's rest records
     * (`hingedArmSwivel.prepare`).
     */
    span: IAutoMovieHingedArmSpan.ISpan;
  }
}
