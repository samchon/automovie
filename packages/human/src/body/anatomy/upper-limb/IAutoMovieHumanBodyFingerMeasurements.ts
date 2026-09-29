import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * One index, middle, ring or little finger with three distinct phalanges.
 *
 * The enclosing hand names the digit and side. All four share this component
 * schema but own independent observed lengths and volumes; a shared generator
 * is instancing of a rule, not duplication of one person's geometry.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFingerMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Metacarpal belonging to this digit. */
    metacarpal?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** First phalanx beyond metacarpophalangeal joint. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Intermediate phalanx absent in the thumb. */
    middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Terminal phalanx beneath the fingertip. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
