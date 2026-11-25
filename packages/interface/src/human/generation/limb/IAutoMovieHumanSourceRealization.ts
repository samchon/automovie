import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewLoft } from "../../../construction/IAutoMovieViewLoft";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";

/** The part and its loft. */
export interface IAutoMovieHumanSourceRealization {
  /**
   * Actual consumed mass parent/contact, when this result is a mass; no
   * reconstructed attachment is published.
   */
  massConnection?: IAutoMovieHumanMassSource.IConnection;
  /** The view part handed to the operator, or null when the knots are malformed. */
  part: IAutoMovieViewPart | null;

  /** The operator's result, or null with the part. */
  loft: IAutoMovieViewLoft.IResult | null;

  /**
   * The part as the construction tree's view record, metres, or null with the
   * part.
   */
  view: IAutoMovieConstructionView | null;

  /** Every broken premise. */
  diagnostics: IAutoMovieLoftContract.IDiagnostic[];
}
