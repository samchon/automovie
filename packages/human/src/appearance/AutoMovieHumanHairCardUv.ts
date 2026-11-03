import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairImage } from "./AutoMovieHumanHairImage";
import { AutoMovieHumanHairRootBand } from "./AutoMovieHumanHairRootBand";

/**
 * Where a card samples the shared strand image. v runs from root to tip,
 * mapped so the image's root band covers the card's root band
 * (`AutoMovieHumanHairRootBand`) and its tip band the last {@link TIP} mm (at
 * most a fifth of the card), so every card emerges from the scalp as
 * scattered hairs and ends in tapered points of uneven length whatever its
 * length; u takes a quarter-width window of the image chosen by the root's
 * seed.
 */
export namespace AutoMovieHumanHairCardUv {
  /** Length of the card's tip band, millimetres (convention). */
  export const TIP: number = 30;

  /**
   * The card's ends along its length: root band, tip band and the tip band's
   * start, millimetres from the root.
   *
   * @param feather The root's feather
   * @param length The card's length, millimetres
   * @returns `[rootSpan, tipSpan, tipStart]`
   */
  export function ends(
    feather: number,
    length: number,
  ): [number, number, number] {
    const rootSpan: number = AutoMovieHumanHairRootBand.band(feather, length);
    const tipSpan: number = Math.min(TIP, 0.2 * length);
    return [rootSpan, tipSpan, length - tipSpan];
  }

  /**
   * The image's v at an arc length.
   *
   * @param s Arc length from the root, millimetres
   * @param rootSpan Length of the root band, millimetres
   * @param tipSpan Length of the tip band, millimetres
   * @param tipStart Where the tip band starts, millimetres from the root
   * @returns v in [0, 1]
   */
  export function v(
    s: number,
    rootSpan: number,
    tipSpan: number,
    tipStart: number,
  ): number {
    return s < rootSpan
      ? (AutoMovieHumanHairImage.root * s) / rootSpan
      : s > tipStart
        ? AutoMovieHumanHairImage.tip +
          ((1 - AutoMovieHumanHairImage.tip) * (s - tipStart)) / tipSpan
        : AutoMovieHumanHairImage.root +
          ((AutoMovieHumanHairImage.tip - AutoMovieHumanHairImage.root) *
            (s - rootSpan)) /
            Math.max(tipStart - rootSpan, 1e-9);
  }

  /**
   * The left edge of the card's quarter-width window of the image.
   *
   * @param seed The root's seed, shared with its mirror
   * @returns u in {0, 0.25, 0.5, 0.75}
   */
  export function window(seed: number): number {
    return Math.floor(AutoMovieHumanAppearanceNoise.hash(8, seed) * 4) / 4;
  }
}
