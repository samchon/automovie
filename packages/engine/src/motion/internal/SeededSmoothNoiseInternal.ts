/*
 * Shared spectrum and scalar operations for the direct and prepared readers.
 */
export namespace SeededSmoothNoiseInternal {
  /*
   * Copied spectral inputs; no current or previous motion value is stored.
   */
  export interface ISpectrum {
    /*
     * Exact 2_pi_frequency products in original term order, radians/second.
     */
    rates: readonly number[];

    /*
     * Exact indexed phase products in original term order, radians.
     */
    phases: readonly number[];

    /*
     * The direct function's square root of the term count.
     */
    normalizer: number;
  }

  /*
   * Keep the direct entry's parameter domain and first-read refusal text.
   */
  export function admit(
    duration: number,
    maxFrequency: number,
    terms: number,
  ): void {
    if (!(duration > 0) || !(maxFrequency > 0) || !(terms > 0))
      throw new Error(
        "Smooth noise needs a positive duration, frequency and term count",
      );
  }

  /*
   * Preserve the original multiplication grouping for every actual term.
   */
  export function oscillation(
    rate: number,
    phase: number,
    u: number,
    duration: number,
  ): number {
    return Math.sin(rate * u * duration + phase);
  }

  /*
   * One owner of the original contact-preserving window and normalization.
   */
  export function windowed(sum: number, u: number, normalizer: number): number {
    const bump: number = 16 * u * u * (1 - u) * (1 - u);
    return (bump * bump * sum) / normalizer;
  }
}
