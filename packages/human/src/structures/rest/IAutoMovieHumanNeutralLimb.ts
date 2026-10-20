import { IAutoMovieHumanNeutralChord } from "./IAutoMovieHumanNeutralChord";
import { IAutoMovieHumanNeutralEnvelope } from "./IAutoMovieHumanNeutralEnvelope";
import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/** Mechanical segment lengths and dimensioned tube sites, not clinical lengths.
 */
export interface IAutoMovieHumanNeutralLimb {
  /** Proximal joint to intermediate joint. */
  upper: IAutoMovieHumanNeutralChord;

  /** Intermediate joint to wrist/ankle. */
  lower: IAutoMovieHumanNeutralChord;

  /** Mid upper-segment bone-normal envelope, outside the branch region. */
  upperMid: IAutoMovieHumanNeutralEnvelope;

  /** Quarter lower-segment bone-normal envelope; not asserted a maximum. */
  lowerQuarter: IAutoMovieHumanNeutralEnvelope;

  /** Joint envelope when measured; null marks an absent observation. */
  joint: IAutoMovieHumanSurfaceEnvelope | null;

  /** Terminal envelope when measured; null marks an absent observation. */
  terminal: IAutoMovieHumanSurfaceEnvelope | null;
}
