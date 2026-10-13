/**
 * One source-authored bounded activation of an existing world effect zone on the shot-local clock.
 *
 * @evidence contracts/common.md#principled-implementation Engine effect validation admits unique cue identity, existing zone, half-open shot-local range and bounded intensity endpoints; an optional event must resolve to a current compiled sample within that range.
 * @evidence contracts/common.md#clear-and-simple-design The cue owns activation and envelope while the world zone owns spatial bounds, recipe, seed and budget, keeping authored timing separate from deterministic effect materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing zones and absent or out-of-cue event samples refuse rather than generating a substitute stream or accepting an echoed event id.
 * @evidence contracts/common.md#meaningful-documentation Defines unique cue and zone identity, inclusive/exclusive seconds, intensity endpoints and optional authoritative event binding.
 * @author Samchon
 */
export interface IAutoMovieShotEffectCue {
  /** Stable cue id, unique inside one shot. */
  id: string;

  /** Existing world effect-zone id. */
  zone: string;

  /** Inclusive shot-local start in seconds. */
  start: number;

  /** Exclusive shot-local end in seconds. */
  end: number;

  /** Bounded intensity envelope. */
  intensity: {
    /** Intensity at cue start. */
    from: number;

    /** Intensity at cue end. */
    to: number;
  };

  /** Optional authoritative shot event that must realize inside this cue. */
  event?: string;
}
