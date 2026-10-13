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
 * @evidence contracts/common.md#principled-implementation `performShot` performs `revise.final ?? draft`, so a correction replaces the draft wholesale, and it requires a script beat, a finite positive duration and, when a blocking is supplied, that blocking's beat and a duration within 1e-6 s of it.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the first program and the self-review in one record so the correction decision is auditable without a second artifact; violation paths name `$input.revise.final` or `$input.draft` by which list performed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `enact` is the single verb that plays a hand-authored clip, and that clip still goes through the masking, ROM and artifact checks synthesized verbs pass; no beat is special-cased.
 * @evidence contracts/common.md#meaningful-documentation Documents the `final ?? draft` rule, the null meaning of `revise.final`, the seconds unit of `duration`, `enact` as the only keyframe route, and which fields are unchecked prose.
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
