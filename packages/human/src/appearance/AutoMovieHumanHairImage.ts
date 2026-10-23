import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * Procedural strand image for hair cards: grey luminance and coverage
 * alpha (PNG greyscale-alpha), u across the strands and v from root
 * (row 0) to tip.
 *
 * The image holds 96 strand lines across its width, each standing for a
 * few physical hairs (a card is several millimetres wide while a hair is
 * about 0.08 mm, `docs/anatomy/hair.md`). Strands gather in clumps of six,
 * wave slightly and vary in luminance. Coverage combines overlapping
 * strands as independent occluders, `1 - prod(1 - a)`. All counts, widths
 * and contrasts are conventions; the image is independent of hair colour
 * (the material multiplies the luminance by the category colour) and of
 * the person, so every Human shares one copy.
 *
 * Two bands of v hold the card's ends, which the cards map onto fixed
 * physical lengths at the root and the tip (`AutoMovieHumanHairCard`):
 *
 * - root band `[0, {@link root}]`: each strand starts at its own place in
 *   the band and fades in, so a card's root edge reads as scattered hairs
 *   emerging from the scalp, not as a straight cut across the card;
 * - tip band `[{@link tip}, 1]`: each strand ends at its own place in the
 *   band, more of them near the end than near its start, narrowing and
 *   fading out as it ends, while the clump's strands converge on the
 *   clump's centre, so a card ends in tapered points of uneven length, as
 *   cut hair does, not in a straight brush line.
 *
 * The image repeats horizontally: strands crossing the left or right edge
 * wrap, so a card may sample any window of it with a repeating sampler.
 */
export namespace AutoMovieHumanHairImage {
  /** Image id the hair material cites. */
  export const id: string = "human.hair.strands";

  /** Width in pixels (across strands). */
  export const width: number = 256;

  /** Height in pixels (along strands). */
  export const height: number = 512;

  /** End of the root band in v. */
  export const root: number = 0.05;

  /** Start of the tip band in v. */
  export const tip: number = 0.7;

  /**
   * Generate the strand image.
   *
   * @returns Greyscale-alpha PNG image
   */
  export function generate(): IAutoMovieImage {
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const strands: number = 96;
    const clump: number = 6;

    // Accumulated transmittance (1 - coverage) and coverage-weighted
    // luminance per pixel.
    const clear: Float64Array = new Float64Array(width * height).fill(1);
    const shade: Float64Array = new Float64Array(width * height);

    for (let s: number = 0; s < strands; ++s) {
      const h: number = N.hash(60, s);
      const x0: number = (s + 0.5 + 0.6 * (N.hash(61, s) - 0.5)) / strands;
      const centre: number =
        (Math.floor(s / clump) * clump + clump / 2) / strands;
      const begin: number = 0.9 * root * N.hash(65, s);
      const end: number = 1 - 0.9 * (1 - tip) * N.hash(62, s) ** 2;
      const halfWidth: number = 0.8 + 0.5 * h;
      const brightness: number = 0.84 + 0.16 * N.hash(63, s);
      const phase: number = 2 * Math.PI * N.hash(64, s);

      for (let row: number = 0; row < height; ++row) {
        const v: number = (row + 0.5) / height;
        if (v > end) break;
        if (v < begin) continue;

        // Centre line in pixels: slight clump convergence along the
        // length, strong in the tip band, and a gentle wave of about one
        // pixel.
        const gather: number = 0.15 * v + 0.6 * N.smoothstep(tip, 1, v);
        const x: number =
          (x0 + (centre - x0) * gather) * width +
          1.2 * Math.sin(2 * Math.PI * v * 3 + phase);
        const along: number =
          N.smoothstep(begin, begin + 0.012, v) *
          (1 - N.smoothstep(end - 0.05, end, v));
        const half: number = halfWidth * (0.45 + 0.55 * along);
        const lum: number = brightness * (0.9 + 0.1 * v);

        for (
          let col: number = Math.floor(x - half - 1);
          col <= Math.ceil(x + half + 1);
          ++col
        ) {
          // Coverage of a pixel by the strand's soft profile.
          const d: number = Math.abs(col + 0.5 - x);
          const a: number =
            along * (1 - N.smoothstep(half - 0.5, half + 0.7, d));
          if (a <= 0) continue;
          const at: number = row * width + (((col % width) + width) % width);
          shade[at]! += a * clear[at]! * lum;
          clear[at]! *= 1 - a;
        }
      }
    }

    const pixels: Uint8Array = new Uint8Array(width * height * 2);
    for (let i: number = 0; i < width * height; ++i) {
      const coverage: number = 1 - clear[i]!;
      const lum: number = coverage > 0 ? shade[i]! / coverage : 0;
      pixels[i * 2] = Math.round(255 * Math.min(1, lum));
      pixels[i * 2 + 1] = Math.round(255 * coverage);
    }
    return {
      id,
      mimeType: "image/png",
      data: encodeAutoMoviePng({ width, height, channels: 2, pixels }),
    };
  }
}
