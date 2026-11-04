import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * The card's widening from a third of its width at the root over its root
 * band: cut square across its width, the roots of cards combed back at an
 * angle lined up as a saw edge along the hairline (a convention of this
 * prototype).
 */
export namespace AutoMovieHumanHairCardRootFlare {
  /** Share of the width at the root (convention). */
  export const ROOT: number = 1 / 3;

  /** Share of the width gained over the root band: the rest of the width (two thirds). */
  export const GAIN: number = 2 / 3;

  /**
   * Width factor at an arc length.
   *
   * @param s Arc length from the root, millimetres
   * @param rootSpan Length of the root band, millimetres
   * @returns Factor from {@link ROOT} at the root to 1 at the band's end
   */
  export function factor(s: number, rootSpan: number): number {
    return (
      ROOT + GAIN * AutoMovieHumanAppearanceNoise.smoothstep(0, rootSpan, s)
    );
  }
}
