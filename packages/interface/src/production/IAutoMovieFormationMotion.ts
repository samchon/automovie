import type { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieFormationMotionState } from "./IAutoMovieFormationMotionState";

/**
 * One source-authored compact formation cue.
 *
 * Capability labels do not grant this motion; source code authors each cue
 * explicitly.
 */
export interface IAutoMovieFormationMotion {
  /** Stable cue id, unique inside one shot. */
  id: string;

  /** Participating compiled formation id. */
  formation: string;

  /** Review-facing action expressed by this exact cue. */
  action: AutoMovieFormationCapability;

  /**
   * Profile-owned gait name the unit's members perform during this cue.
   *
   * Omitted, the cue's `action` label is tried as a gait name, and the figure's
   * first declared gait performs when nothing carries that name. Explicit
   * validateAutoMovieFormationMotions calls reject an unknown named gait when
   * the compiled unit has a non-empty repertoire; a unit with no declared
   * repertoire has no such admission check.
   */
  gait?: string;

  /**
   * The arrangement this unit is in when the cue ends.
   *
   * Each member interpolates from the previous completed arrangement to this
   * target in the unit frame; the first layout cue starts at its design slot.
   * Completed targets remain between cues, and a later layout cue uses that
   * retained arrangement as its origin.
   *
   * Omitted, sampling retains the preceding layout state, or the design
   * arrangement if none was authored.
   */
  layout?: IAutoMovieFormationDesign["layout"];

  /** Inclusive shot-local cue start. */
  start: number;

  /** Exclusive shot-local cue end. */
  end: number;

  /** State at cue start. */
  from: IAutoMovieFormationMotionState;

  /** State at cue end. */
  to: IAutoMovieFormationMotionState;

  /** Deterministic interpolation curve. */
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "step";
}
