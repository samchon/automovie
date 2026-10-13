/** One source-authored shot-local effect activation. */
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
