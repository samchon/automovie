import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotState } from "./IAutoMovieFormationSlotState";

/**
 * One source-authored exception naming members inside one compiled formation.
 *
 * Unit-level cues move the whole formation; this sparse channel names individual slot exceptions. Stored cue data grows with authored cues and slot references rather than requiring a row for every untouched member. Sampling scans supplied cues and slot lists per query, and rendering or validation still performs its own population work.
 *
 * Sampled exactly as {@link IAutoMovieFormationMotion} is: a member holds the identity state before its first cue, interpolates inside a cue, and retains a cue's `to` state after it ends. So a member removed at four seconds by a cue whose `to` is absent stays absent for the rest of the shot without the author restating it, and a member that falls stays down.
 *
 * A named slot stays an instanced member. Promotion to a named actor is the other, dearer thing: it exists, it is capped, and this is deliberately not it.
 *
 * @evidence contracts/common.md#principled-implementation Sparse cues name explicit unique slot indices and interpolate member-local state over half-open shot-local intervals; sampling holds identity before the first cue and retains the last endpoint afterward.
 * @evidence contracts/common.md#clear-and-simple-design Shares timing and easing with formation-wide motion; stored exceptions scale with authored cues and slot references, while member-query and population execution costs remain with their consumers. Hero promotion stays separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Slot membership is explicit and range-validated; removal is the present channel rather than deletion of the designed slot or automatic promotion to a named actor.
 * @evidence contracts/common.md#meaningful-documentation Explains sparse ownership, retained endpoints, identity before cues, shared-slot timing and the distinction from hero actors; start and end use shot-local seconds.
 */
export interface IAutoMovieFormationSlotMotion {
  /** Stable cue id, unique inside one shot. */
  id: string;

  /** Participating compiled formation id. */
  formation: string;

  /**
   * Zero-based slots this exception names, unique and below the unit's count.
   *
   * Several slots share one cue when the same thing happens to each of them at the same time; a member that needs its own timing gets its own cue.
   */
  slots: number[];

  /** Inclusive shot-local cue start in seconds. */
  start: number;

  /** Exclusive shot-local cue end in seconds. */
  end: number;

  /** Member state at cue start. */
  from: IAutoMovieFormationSlotState;

  /** Member state at cue end. */
  to: IAutoMovieFormationSlotState;

  /** Deterministic interpolation curve. */
  easing: IAutoMovieFormationMotion["easing"];
}
