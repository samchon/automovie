import type { IAutoMovieHumanHeadReading } from "../../common/measure/IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * A solved head: the person with its head channels set, every head rule read
 * on its skin at rest (the targets and the circumference check alike), and
 * the departure from the standard head the solve chose.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolution {
  /** The person with the solve's head channels set. */
  document: IAutoMovieHumanPersonDocument;

  /** Every head rule read on the solved person at rest, by rule name. */
  readings: Record<string, IAutoMovieHumanHeadReading>;

  /**
   * The solved channels' departure from the standard head: the root of the
   * sum of squares of each channel's weight times its departure scale
   * (`humanPersonHeadDeparture`), metres of skin displacement.
   */
  departureMetres: number;
}
