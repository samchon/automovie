import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Seven cervical vertebrae, including atlas C1 and axis C2, named separately. The neck/face skin seam does not duplicate these midline bones.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCervicalVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered C1 vertebra. */
    c1?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C2 vertebra. */
    c2?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C3 vertebra. */
    c3?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C4 vertebra. */
    c4?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C5 vertebra. */
    c5?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C6 vertebra. */
    c6?: IAutoMovieHumanBodyVertebraMeasurements;
    /** Numbered C7 vertebra. */
    c7?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
