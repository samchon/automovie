import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * First toe ray with one metatarsal and only two phalanges.
 *
 * The hallux bears load during push-off; this type excludes a fictitious
 * middle phalanx and does not equate metatarsal length with skin toe length.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyHalluxMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** First metatarsal articulating with medial cuneiform. */
    firstMetatarsal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Hallux proximal phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Hallux distal phalanx. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
