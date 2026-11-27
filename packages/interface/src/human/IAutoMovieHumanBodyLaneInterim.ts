import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyFrame } from "./IAutoMovieHumanBodyFrame";
import type { IAutoMovieHumanLimbSources } from "./IAutoMovieHumanLimbSources";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import type { IAutoMovieHumanTrunkConnection } from "./IAutoMovieHumanTrunkConnection";

/**
 * Resolved trunk, neck and limb source inputs consumed by the interim body
 * lane. Runtime construction and admission remain with
 * AutoMovieHumanBodyLaneInterim in Human.
 */
export namespace IAutoMovieHumanBodyLaneInterim {
  /** What the interim lane reads. */
  export interface IInput {
    /** The same canonical solved placement, including its actual neck owner. */
    solution: IAutoMovieHumanTrunkSolution;

    /** The public input. */
    params: IAutoMovieHumanParameters;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Calibration stature, mm. */
    stature: number;

    /** The crotch's height, calibration mm. */
    crotch: number;

    /** The old trunk's inputs (`AutoMovieHumanBodyLaw` column). */
    trunk: IAutoMovieHumanTrunkInputs;

    /** Common original neck definition, captured before raw lofting. */
    neckConnection: IAutoMovieHumanTrunkConnection.IDefinition;

    /**
     * Same invocation's direct source factories, also consumed by scoped
     * originals.
     */
    sources: IAutoMovieHumanLimbSources.IOutput;

    /**
     * Direct common skin-based AP frame, distinct from the nominal skeletal
     * ankle.
     */
    frame: IAutoMovieHumanBodyFrame.IOutput;
  }
}
