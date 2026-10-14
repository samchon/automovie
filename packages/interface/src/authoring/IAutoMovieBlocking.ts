import { IAutoMovieBlockingActor } from "./IAutoMovieBlockingActor";
import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";
import { IAutoMovieBlockingCoverage } from "./IAutoMovieBlockingCoverage";

/**
 * One shot's plan before any dense motion is synthesized.
 *
 * Prose fields explain craft for review; typed anchors, camera fields and duration carry the facts the engine checks. blockBeat gates the plan against the script, staged set and optional prior beat state. performShot later checks beat, duration, anchor coverage, the earliest chronological frame action's framing/move and coverage cameras; it does not judge cue meaning or compare the hero intent's subject with the performed subject.
 *
 * @evidence contracts/common.md#principled-implementation blockBeat checks beat and placed-node membership, positive finite duration, anchor ranges/order and hero/coverage framing vocabulary. performShot compares beat, duration within 1e-6 s, non-frame actor-action coverage within 1e-9 s and the earliest chronological frame's framing/move; camera election instead follows the first frame camera in authored list order.
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
   * Why the chosen placement, coverage and timing serve that purpose; review prose that no engine gate reads.
   */
  rationale: string;

  /**
   * Per-node intent and optional ordered timing anchors; each names a scene node the staged set places, and a node without an entry has no anchors. Duplicate intent rows are not separately refused.
   */
  actors: IAutoMovieBlockingActor[];

  /**
   * Hero camera intent. performShot compares framing and move with the earliest frame action after sorting by start; with no frame action only a static move passes. In that static case the intent's framing and subject are not verified against the staged view.
   */
  camera: IAutoMovieBlockingCamera;

  /**
   * Additional takes compiled for other staged cameras over the whole beat. Each names a staged camera that is neither the elected hero camera nor another take's camera; omitted means only the hero take is compiled.
   */
  coverage?: IAutoMovieBlockingCoverage[];

  /**
   * Finite positive shot-local duration in seconds; the performance must match it within `1e-6` s.
   */
  duration: number;
}
