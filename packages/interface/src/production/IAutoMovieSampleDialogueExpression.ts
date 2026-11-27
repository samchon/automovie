import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/** Inputs of sampling a speaker's dialogue mouth beside the authored expression. */
export namespace IAutoMovieSampleDialogueExpression {
  /**
   * A joined timeline, a film frame and the authored expression.
   *
   * Engine's `sampleAutoMovieDialogueExpression` blends the timeline's visemes
   * at the frame by coarticulation (`sampleAutoMovieDialogueVisemeWeights`) and
   * returns them beside the authored expression, retained by reference. A
   * non-finite frame or a rate that is not positive throws; the timeline is
   * assumed to have passed the join and is not revalidated. Any frame may be
   * sampled in any order.
   */
  export type IProps = {
    /** Borrowed joined actor mouth timeline. */
    timeline: IAutoMovieDialogueVisemeTimeline;

    /**
     * Film-global frame, which stands for film time `frame / fps`; may be
     * fractional.
     */
    frame: number;

    /** Film frames per second. */
    fps: number;

    /**
     * Authored emotion/expression, retained by reference unchanged in the
     * returned layers; null preserves absence.
     */
    authored: IAutoMovieExpression | null;
  };
}
