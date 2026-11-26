import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMovieViolationAppendRangeSink } from "./IAutoMovieViolationAppendRangeSink";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Data and callback contracts shared by the ValidateExpression operations. */
export namespace IAutoMovieValidateExpression {
  /**
   * Admit preset/channel membership, intensity/weight ranges and duplicate
   * ARKit channels.
   *
   * A supplied sink is advanced and returned unchanged. Omission creates a
   * full collector; a narrower supplied sink is required because it is returned.
   */
  export type IInjectedProps<
    Sink extends IAutoMovieViolationAppendRangeSink = IAutoMovieViolationCollector,
  > = Omit<IProps<Sink>, "collector"> & { collector: Sink };

  /** Inputs for expression admission with an optional violation sink. */
  export type IProps<
    Sink extends IAutoMovieViolationAppendRangeSink =
      IAutoMovieViolationCollector,
  > = {
    /**
     * Borrowed preset and optional blendshape weights with inclusive 0..1
     * magnitudes.
     */
    expression: IAutoMovieExpression;

    /** Base diagnostic address, defaulting to $input. */
    path?: string;

    /**
     * Borrowed sink advanced and returned unchanged, or omitted for a fresh
     * full collector.
     */
    collector?: Sink;
  };
}
