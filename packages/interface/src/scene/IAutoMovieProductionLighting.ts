import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieLight } from "./IAutoMovieLight";

/**
 * Production light sources and tracks evaluated on the declared story clock.
 *
 * A production track supplies a shared source at an explicit story instant; a shot's lightMotions animates sources on its own local clock. The two use the same pointer-channel sampler.
 *
 * inheritProductionLighting can evaluate a pin's origin and rate at a supplied shot second, but the current Production assembleShotSource caller supplies seconds:0. It inherits opening state only; it does not carry production tracks through the shot. Continued animation requires shot-local lightMotions.
 *
 * Omission preserves shot-only lighting. An unpinned shot inherits no invented story epoch; pinned shots sample their declared opening story instant.
 *
 * @evidence contracts/common.md#principled-implementation Shared light shapes and pointer sampling evaluate story seconds mapped by an explicit pin. The production caller currently samples only shot second zero, then merges shot-local lights by id; this is opening-state inheritance rather than a wired through-shot production animation.
 * @evidence contracts/common.md#clear-and-simple-design One production light population and motion list establish cross-shot authority without duplicating a clock or repeating the same source on every shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unpinned shots inherit no invented epoch state, and absent production lighting preserves the shot-only path; motion ids and channels still owe existing light admission.
 * @evidence contracts/common.md#meaningful-documentation Defines epoch state, story-second channels, pin mapping, omission and current opening-only inheritance; shot-local tracks own continued animation.
 * @author Samchon
 */
export interface IAutoMovieProductionLighting {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /**
   * The production's light sources, carrying their values at story time zero (the clock's declared `epoch`).
   *
   * The same scene-light shape is used at this wider scope; it introduces no separate renderer representation.
   */
  lights: IAutoMovieLight[];

  /**
   * Clips moving those lights across the story clock, in story seconds.
   *
   * Addressed exactly as a shot's `lightMotions` are; one pointer channel per track, `/lights/<light id>/<property>`; and evaluated by the same pass. A production light travels, turns, warms and dims through the same table a shot's candle does; only the clock the keyframe times are read against differs, so there is one grammar to learn and one applier to trust.
   *
   * Empty means the production declares sources that never change, which is still worth stating: every shot then inherits one agreed source instead of restaging its own.
   */
  motions: IAutoMovieClip[];
}
