import {
  IAutoMovieConstraintViolation,
  IAutoMovieSequence,
} from "@automovie/interface";

/**
 * An assembled cut: the {@link IAutoMovieSequence} the ASSEMBLE stage edited, or
 * the contradictions that stopped it.
 *
 * @author Samchon
 */
export type IAutoMovieCut = IAutoMovieCut.ISuccess | IAutoMovieCut.IFailure;

export namespace IAutoMovieCut {
  /** Every entry referenced a built shot and every trim fit inside it. */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The cut-list, ready for the renderer. */
    sequence: IAutoMovieSequence;

    /**
     * Total running time in seconds (trims applied, transitions overlap-free).
     */
    runtime: number;
  }

  /** The cut referenced a missing shot or trimmed outside one. */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
