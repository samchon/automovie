import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Thumb ray with first metacarpal and only proximal/distal phalanges.
 *
 * Opposition uses a different carpometacarpal articulation from the fingers;
 * no middle phalanx can be inserted by this closed thumb type.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThumbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** First metacarpal articulating with trapezium. */
    firstMetacarpal?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Thumb proximal phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Thumb distal phalanx. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
