import { IAutoMovieHumanNeutralChord } from "./IAutoMovieHumanNeutralChord";
import { IAutoMovieHumanNeutralEnvelope } from "./IAutoMovieHumanNeutralEnvelope";
import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/**
 * Mechanical segment lengths and dimensioned bone-normal tube sites.
 *
 * Site origins follow the directed proximal-to-distal chord. The supplying measurement protocol retains the section axes and roll required to interpret signed offsets.
 */
export interface IAutoMovieHumanNeutralLimb {
  /** Proximal joint to intermediate joint. */
  upper: IAutoMovieHumanNeutralChord;

  /** Intermediate joint to wrist/ankle. */
  lower: IAutoMovieHumanNeutralChord;

  /** Bone-normal envelope with its origin halfway along the proximal-to-intermediate chord, outside the branch region. */
  upperMid: IAutoMovieHumanNeutralEnvelope;

  /** Bone-normal envelope with its origin one quarter along the intermediate-to-wrist/ankle chord; not asserted a maximum. */
  lowerQuarter: IAutoMovieHumanNeutralEnvelope;

  /** Joint envelope when measured; null marks an absent observation. */
  joint: IAutoMovieHumanSurfaceEnvelope | null;

  /** Terminal envelope when measured; null marks an absent observation. */
  terminal: IAutoMovieHumanSurfaceEnvelope | null;
}
