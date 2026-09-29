import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Five lumbar vertebrae between thorax and sacrum, each one midline bone. Their separate volumes do not determine loaded standing lordosis.
 * @author Samchon
 */
export type IAutoMovieHumanBodyLumbarVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered L1 vertebra. */
    l1?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered L2 vertebra. */
    l2?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered L3 vertebra. */
    l3?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered L4 vertebra. */
    l4?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered L5 vertebra. */
    l5?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
