import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Twelve thoracic vertebrae articulating with ribs and supporting the bony cage. Their separate volumes do not determine curvature or intervertebral disc geometry.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyThoracicVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered T1 vertebra. */
    t1?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T2 vertebra. */
    t2?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T3 vertebra. */
    t3?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T4 vertebra. */
    t4?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T5 vertebra. */
    t5?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T6 vertebra. */
    t6?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T7 vertebra. */
    t7?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T8 vertebra. */
    t8?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T9 vertebra. */
    t9?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T10 vertebra. */
    t10?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T11 vertebra. */
    t11?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered T12 vertebra. */
    t12?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
