import type { IAutoMovieHingedArmSpan } from "../pose/IAutoMovieHingedArmSpan";
import type { IAutoMoviePrepareChainFit } from "./IAutoMoviePrepareChainFit";

/**
 * Contracts of `prepareChainRigConstants`: the rig readers one prepared chain keeps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which fixed chain-fit readers a prepared chain keeps and its span.
 * @evidence contracts/development/design.md#principled-representation The chain-fit readers a chain needs, picked from `IAutoMoviePrepareChainFit.IRig`, with the chain's span.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareChainRigConstants` produces it for `prepareChainConstants` and the prepared chain plant.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Picks the readers instead of copying them; no result is retained.
 */
export namespace IAutoMoviePrepareChainRigConstants {
  /** The rig-only readers of `IAutoMoviePrepareChainFit.IRig` and the hinge span holder. */
  export interface IRig
    extends Pick<
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
    > {
    /** The hinge's span coefficients, read at the first branch query and shared by every source of this chain's rest records (`hingedArmSwivel.prepare`). */
    span: IAutoMovieHingedArmSpan.ISpan;
  }
}
