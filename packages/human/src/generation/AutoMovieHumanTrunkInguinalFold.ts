/** The lower trunk's fold sampling convention. */
export namespace AutoMovieHumanTrunkInguinalFold {
  /**
   * A fold spans two and a half samples transversely so two intervals can
   * resolve it.
   */
  export const SAMPLES: number = 1.25;

  /** The fold's half reach from its control pitch and row spacing, mm. */
  export function softness(pitch: number, gap: number): number {
    return SAMPLES * Math.max(pitch, gap);
  }
}
