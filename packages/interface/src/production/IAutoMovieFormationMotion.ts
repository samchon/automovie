import { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieFormationMotionState } from "./IAutoMovieFormationMotionState";

/**
 * One source-authored compact formation cue.
 *
 * Capability labels do not grant this motion; source code authors each cue explicitly.
 *
 * @evidence contracts/common.md#principled-implementation sampleFormationMotion interpolates finite authored states on a shot-local interval; formationSlotPosition blends the previous completed layout toward the cue layout, using the design slots before the first reform.
 * @evidence contracts/common.md#clear-and-simple-design One cue owns its participant, interval, endpoints and easing; gait names remain in the member profile instead of a second gait vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No capability label creates a cue or per-slot curve. Sequential reform retains the prior completed target and layout-free cues preserve it; this assumes admitted cue chronology and does not add a visual-quality guarantee.
 * @evidence contracts/common.md#meaningful-documentation Fields identify interval endpoint conventions, profile-owned gait selection and the current layout interpolation origin.
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
   * Omitted, the cue's `action` label is tried as a gait name, and the figure's first declared gait performs when nothing carries that name. Explicit validateAutoMovieFormationMotions calls reject an unknown named gait when the compiled unit has a non-empty repertoire; a unit with no declared repertoire has no such admission check.
   */
  gait?: string;

  /**
   * The arrangement this unit is in when the cue ends.
   *
   * Each member interpolates from the previous completed arrangement to this target in the unit frame; the first layout cue starts at its design slot. Completed targets remain between cues, and a later layout cue uses that retained arrangement as its origin.
   *
   * Omitted, sampling retains the preceding layout state, or the design arrangement if none was authored.
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
