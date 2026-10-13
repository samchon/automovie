import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotState } from "./IAutoMovieFormationSlotState";

/**
 * One source-authored exception naming members inside one compiled formation.
 *
 * The unit-level channel is the whole of what a group does together, so nothing
 * can happen to one member of a crowd through it: a cue that moves a unit moves
 * every member of it. This is the sparse channel beside it. It names slots, not
 * members-in-general, and it costs the number of exceptions rather than the
 * size of the crowd, so three members of a hundred thousand cost three.
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
   * Zero-based slots this exception names, unique and below the unit's count.
   *
   * Several slots share one cue when the same thing happens to each of them at
   * the same time; a member that needs its own timing gets its own cue.
   */
  slots: number[];

  /** Inclusive shot-local cue start. */
  start: number;

  /** Exclusive shot-local cue end. */
  end: number;

  /** Member state at cue start. */
  from: IAutoMovieFormationSlotState;

  /** Member state at cue end. */
  to: IAutoMovieFormationSlotState;

  /** Deterministic interpolation curve. */
  easing: IAutoMovieFormationMotion["easing"];
}
