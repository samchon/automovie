import { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * Thin verb program compiled into one dense, ROM-checked shot.
 *
 * {@link draft} is the first complete program and {@link revise} records the code
 * author's own correction decision. The engine executes exactly {@code
 * revise.final ?? draft}; handwritten keyframes remain available only through
 * the explicit {@code enact} escape hatch. `plan` and `revise.review` are
 * review prose that no engine gate reads.
 *
 * @author Samchon
 */
export interface IAutoMoviePerformance {
  /** Script beat and registered shot identity realized by this program. */
  beat: string;

  /** How the intended action decomposes into engine verbs and timing. */
  plan: string;

  /** First complete action program, including camera actions. */
  draft: IAutoMovieActionCall[];

  /** Auditable self-review and optional corrected program. */
  revise: {
    /** Range, causality, region, camera and timing assessment. */
    review: string;

    /** Corrected action program, or null when the draft already stands. */
    final: IAutoMovieActionCall[] | null;
  };

  /** Finite positive shot-local duration in seconds. */
  duration: number;
}
