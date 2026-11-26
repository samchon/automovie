import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieViolationAppendRotationSink } from "./IAutoMovieViolationAppendRotationSink";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Data and callback contracts shared by the ValidatePose operations. */
export namespace IAutoMovieValidatePose {
  /**
   * Admit skeleton identity, optional root transform, duplicate/undeclared
   * joint bones and effective rig/default ROM.
   *
   * A supplied sink is advanced and returned unchanged. Omission creates a
   * full collector; a narrower supplied sink is required because it is returned.
   */
  export type IInjectedProps<
    Sink extends IAutoMovieViolationAppendRotationSink = IAutoMovieViolationCollector,
  > = Omit<IProps<Sink>, "collector"> & { collector: Sink };

  /** Inputs for pose admission with an optional violation sink. */
  export type IProps<
    Sink extends IAutoMovieViolationAppendRotationSink =
      IAutoMovieViolationCollector,
  > = {
    /**
     * Borrowed pose; null joint angles mean rest and invalid angles are
     * reported without clamping.
     */
    pose: IAutoMoviePose;

    /** Current rig for bone identity and per-bone/default degree constraints. */
    skeleton: IAutoMovieSkeleton;

    /** Base diagnostic address, defaulting to $input. */
    path?: string;

    /**
     * Borrowed sink advanced and returned unchanged, or omitted for a fresh
     * full collector.
     */
    collector?: Sink;
  };
}
