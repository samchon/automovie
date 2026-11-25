import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";

/** Data and callback contracts shared by the ValidateContinuity operations. */
export namespace IAutoMovieValidateContinuity {
  /**
   * Compare every prior-end actor to the incoming opening for missing presence,
   * Euclidean drift, facing angle and persistent mount changes.
   */
  export type IProps = {
    /** The previous beat's resolved end-state. */
    previous: IAutoMovieBeatEndState;

    /** The incoming beat's resolved opening-state. */
    opening: IAutoMovieBeatEndState;

    /** World-space position drift tolerated (metres); defaults to 0.05. */
    positionTolerance?: number;

    /** Facing drift tolerated (degrees); defaults to 5. */
    facingToleranceDeg?: number;
  };
}
