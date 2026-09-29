import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * One second-through-fifth toe ray with metatarsal and three phalanges.
 *
 * The enclosing foot supplies toe number and side; the bones are distinct
 * instances even if a generator shares a code path. Skin toe length cannot
 * independently determine every joint surface or phalangeal volume.
 * @author Samchon
 */
export type IAutoMovieHumanBodyToeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Same-number metatarsal. */
    metatarsal?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Proximal toe phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Intermediate toe phalanx, absent in the hallux. */
    middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Distal phalanx supporting the nail bed. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
