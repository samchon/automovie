import { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * Thin verb program that `performShot` compiles into one dense shot whose
 * clips pass range-of-motion validation.
 *
 * {@link draft} is the first complete program and {@link revise} records the
 * author's own correction decision. The engine executes exactly
 * `revise.final ?? draft`, so a non-null `final` replaces the draft entirely
 * and the draft is neither validated nor performed. Handwritten keyframes
 * remain available only through the explicit `enact` verb. `plan` and
 * `revise.review` are review prose that no engine gate reads.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` refuses a blank beat or one absent from the script and a non-finite or non-positive duration, selects `revise.final ?? draft` as the one action list, bounds every action span inside `[0, duration]`, synthesizes the clips and validates them against each actor's skeleton, and, when a blocking is supplied, requires the same beat and a duration within `1e-6` s.
 * @evidence contracts/common.md#clear-and-simple-design Draft, review and correction sit in one record so the self-review stays auditable beside what it changed, while only the selected list reaches the compiler, which keeps one action vocabulary for both rounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The draft is not merged with the correction or used as a fallback when `final` fails, and the prose fields are declared unread instead of being given a verifier.
 * @evidence contracts/common.md#meaningful-documentation States the execution rule and that a non-null `final` makes the draft inert, the escape hatch for keyframes, which fields are prose, how the beat names the shot when no id is supplied, and the duration unit and bounds.
 * @author Samchon
 */
export interface IAutoMoviePerformance {
  /**
   * Non-blank script beat realized by this program. When the caller supplies
   * no shot id, the compiled shot is identified as `shot:<beat>`.
   */
  beat: string;

  /** How the intended action decomposes into verbs and timing; never read. */
  plan: string;

  /**
   * First complete action program, camera `frame` actions included; performed
   * only while `revise.final` is `null`.
   */
  draft: IAutoMovieActionCall[];

  /** Auditable self-review and optional corrected program. */
  revise: {
    /** Range, causality, region, camera and timing assessment; never read. */
    review: string;

    /**
     * Complete corrected action program that replaces the draft, or `null`
     * when the draft stands.
     */
    final: IAutoMovieActionCall[] | null;
  };

  /**
   * Finite positive shot-local duration in seconds; every action span must lie
   * inside `[0, duration]`.
   */
  duration: number;
}
