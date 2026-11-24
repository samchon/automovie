/** Original web-along controls expressed against their own full-source chord. */
export namespace AutoMovieHumanNativeFanControls {
  /**
   * Normalized original along controls follow their own current full-source chord.
   * Depth is a separate control and is never inferred from an along ratio.
   */
  export function profile(
    knots: readonly (readonly [number, number])[],
    originalChord: number,
    chord: number,
  ): [number, number][] {
    if (
      ![originalChord, chord].every(Number.isFinite) ||
      originalChord <= 0 ||
      chord <= 0
    )
      throw new Error("fan chords must be finite and positive");
    return knots.map(
      ([along, depth]: readonly [number, number]): [number, number] => [
        along * (chord / originalChord),
        depth,
      ],
    );
  }
}
