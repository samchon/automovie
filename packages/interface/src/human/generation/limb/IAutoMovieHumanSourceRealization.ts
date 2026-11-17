import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewLoft } from "../../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";

/** The part and its loft.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The part and its loft.
 * @evidence contracts/development/design.md#principled-representation `massConnection`: Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published. `part`: The view part handed to the operator, or null when the knots are malformed. `loft`: The operator's result, or null with the part.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaw.trunkLoft, AutoMovieHumanBodyPreparation.loft, AutoMovieHumanArmWalk.create. Also types AutoMovieHumanBodyLane.view, AutoMovieHumanBodyLaw.rawSources.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `massConnection`: Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published.
 */
export interface IAutoMovieHumanSourceRealization {
  /** Actual consumed mass parent/contact, when this result is a mass; no reconstructed attachment is published. */
  massConnection?: IAutoMovieHumanMassSource.IConnection;
  /** The view part handed to the operator, or null when the knots are malformed. */
  part: IAutoMovieViewPart | null;

  /** The operator's result, or null with the part. */
  loft: IAutoMovieViewLoft.IResult | null;

  /** The part as the construction tree's view record, metres, or null with the part. */
  view: IAutoMovieConstructionView | null;

  /** Every broken premise. */
  diagnostics: IAutoMovieLoftContract.IDiagnostic[];
}
