import { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * Thin verb program compiled by performShot into one shot through staged input, motion, coupling, camera and artifact gates.
 *
 * draft is the first complete program and revise records the author's correction decision. The engine's semantic action gates and compiler read exactly revise.final ?? draft; a non-null final replaces the draft entirely, while a separate whole-record schema boundary may still inspect draft shape. Handwritten keyframes enter through enact. plan and revise.review are review prose that no engine gate reads.
 *
 * @evidence contracts/common.md#principled-implementation performShot admits beat, duration and the selected final-or-draft action spans before compilation, then checks each emitted actor motion with validateMotion when the runtime resolves a skeleton. Supplied blocking adds beat/duration and anchor/camera coherence; a custom synthesizer can return null, so action admission alone does not certify every intended motion was emitted.
 * @evidence contracts/common.md#clear-and-simple-design Draft, review and correction sit in one record so the self-review stays auditable beside what it changed, while only the selected list reaches the compiler, which keeps one action vocabulary for both rounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The draft is not merged with the correction or used as a fallback when `final` fails, and the prose fields are declared unread instead of being given a verifier.
 * @evidence contracts/common.md#meaningful-documentation States the execution rule and that a non-null `final` makes the draft inert, the escape hatch for keyframes, which fields are prose, how the beat names the shot when no id is supplied, and the duration unit and bounds.
 */
export interface IAutoMoviePerformance {
  /**
   * Non-blank script beat realized by this program. When the caller supplies no shot id, the compiled shot is identified as `shot:<beat>`.
   */
  beat: string;

  /** How the intended action decomposes into verbs and timing; never read. */
  plan: string;

  /**
   * First complete action program, camera frame actions included; selected by engine semantic compilation only while revise.final is null.
   */
  draft: IAutoMovieActionCall[];

  /** Auditable self-review and optional corrected program. */
  revise: {
    /** Range, causality, region, camera and timing assessment; never read. */
    review: string;

    /**
     * Complete corrected action program that replaces the draft, or null when the draft stands.
     */
    final: IAutoMovieActionCall[] | null;
  };

  /**
   * Finite positive shot-local duration in seconds; every action span must lie inside `[0, duration]`.
   */
  duration: number;
}
