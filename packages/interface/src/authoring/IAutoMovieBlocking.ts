import { IAutoMovieBlockingActor } from "./IAutoMovieBlockingActor";
import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";
import { IAutoMovieBlockingCoverage } from "./IAutoMovieBlockingCoverage";

/**
 * One shot's plan before any dense motion is synthesized.
 *
 * Prose fields explain craft for review; the typed anchors, camera fields and
 * duration carry the facts the engine checks. `blockBeat` gates the plan
 * against the script, the staged set and an optional prior beat end state, and
 * `performShot` later holds the action program to the plan's beat, duration,
 * anchors, hero framing and move, and coverage cameras.
 *
 * @evidence contracts/common.md#principled-implementation The plan is checked by reference and order, not by judging craft: `blockBeat` refuses a beat absent from the script, a non-finite or non-positive duration, an intent or `on` node the staged set does not place, an anchor outside `[0, duration]` or earlier than its predecessor, and a coverage camera that is unstaged, repeated or states an unknown framing or move; `performShot` then compares beat, duration within `1e-6` s, anchor coverage and the first `frame` action against it.
 * @evidence contracts/common.md#clear-and-simple-design One record holds the beat-level plan, with per-actor intent, the hero camera and each alternate take as their own types, so the gates that read each part own its rules and the review prose sits beside the facts it explains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `analysis` and `rationale` are documented as unchecked prose rather than given a fake verifier, and a `static` hero intent accepting no `frame` action is the documented locked-off case, not an exemption for a fixture.
 * @evidence contracts/common.md#meaningful-documentation States which gate checks each field, that the prose fields are never read, the hero camera's comparison rule and its static case, the coverage camera distinctness rule, and the duration unit and matching tolerance.
 * @author Samchon
 */
export interface IAutoMovieBlocking {
  /** Non-blank script beat id realized by this plan; it must name a beat. */
  beat: string;

  /** Dramatic purpose for later visual review; no engine gate reads it. */
  analysis: string;

  /**
   * Why the chosen placement, coverage and timing serve that purpose; review
   * prose that no engine gate reads.
   */
  rationale: string;

  /**
   * Per-actor intent and optional causal timing anchors; each names a node the
   * staged set places, and an actor without an entry simply has no anchors.
   */
  actors: IAutoMovieBlockingActor[];

  /**
   * Hero camera intent. `performShot` compares its `framing` and `move` with
   * the first `frame` action; with no `frame` action only a `static` intent
   * passes, because the shot then keeps a locked-off camera.
   */
  camera: IAutoMovieBlockingCamera;

  /**
   * Additional takes rendered from other staged cameras over the whole beat.
   * Each names a staged camera that is neither the elected hero camera nor
   * another take's camera; omitted means the beat has only the hero take.
   */
  coverage?: IAutoMovieBlockingCoverage[];

  /**
   * Finite positive shot-local duration in seconds; the performance must match
   * it within `1e-6` s.
   */
  duration: number;
}
