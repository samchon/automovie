import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMovieFormationSlotState } from "./IAutoMovieFormationSlotState";

/**
 * One source-authored exception naming members inside one compiled formation.
 *
 * Unit-level cues move the whole formation; this sparse channel names
 * individual slot exceptions. Stored cue data grows with authored cues and slot
 * references rather than requiring a row for every untouched member. Sampling
 * scans supplied cues and slot lists per query, and rendering or validation
 * still performs its own population work.
 *
 * Sampled exactly as {@link IAutoMovieFormationMotion} is: a member holds the
 * identity state before its first cue, interpolates inside a cue, and retains a
 * cue's `to` state after it ends. So a member removed at four seconds by a cue
 * whose `to` is absent stays absent for the rest of the shot without the author
 * restating it, and a member that falls stays down.
 *
 * A named slot stays an instanced member. Promotion to a named actor is the
 * other, dearer thing: it exists, it is capped, and this is deliberately not
 * it.
 */
export interface IAutoMovieFormationSlotMotion {
  /** Stable cue id, unique inside one shot. */
  id: string;

  /** Participating compiled formation id. */
  formation: string;

  /**
   * Nonempty list of unique zero-based safe integer slot indices below the
   * compiled formation's count. Each index names an anonymous member.
   *
   * Several slots share one cue when the same thing happens to each of them at
   * the same time; a member that needs its own timing gets its own cue.
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
