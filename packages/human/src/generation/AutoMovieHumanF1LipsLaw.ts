/**
 * The lips' law in the mouth's frame: the lips' line and the two vermilion edges as even functions of the station from the median plane
 * to the mouth's corner. It reads no family and no figure; `packages/human/docs/techniques/face-one-shot.md` holds the design and the
 * comparison with the f1 reference.
 *
 * Frame: the mouth's (`AutoMovieHumanF1FaceCentres.muzzle`). A station `s` is the distance from the median plane along the mouth's line,
 * from 0 to half the mouth's width; a height is measured up from the lips' line at the median (stomion), millimetres.
 *
 * What is published and what is not:
 * - The three lengths are the person's: mouth width (cheilion to cheilion) and the two vermilion heights at the median (labiale superius
 *   to stomion, stomion to labiale inferius), the inputs of `IAutoMovieHumanMouth`.
 * - The philtral crests stand a quarter of the mouth's width apart: 0.245 to 0.26 in four groups (FaceBase 3D Facial Norms, white adults
 *   20 to 40, 13.3 over 50.9 in men and 11.8 over 48.1 in women; Jayaratne et al. 2013, Chinese adults, 12.80 over 49.70 and 11.14 over
 *   45.18). So the upper edge's crest stands an eighth of the width from the median.
 * - No source read gives the depth of cupid's bow, the edges' course between the crest and the corner, or the fall of the lips' line to
 *   the corner. They are inputs here (`bow`, `fall`) and shapes declared below, each the smooth curve of least degree through what is
 *   known; a person's own reading sets the two inputs, and neither is a published prior.
 * - A vermilion edge is a border of colour. A mesh without colour shows only each lip's most forward point, so a reference checks the
 *   law's heights at the median landmarks and the forward points' trend, not the edges themselves.
 */
export namespace AutoMovieHumanF1LipsLaw {
  /** One mouth's measures. */
  export interface IMouth {
    /** Mouth width, cheilion to cheilion, mm. */
    width: number;

    /** Upper vermilion height at the median, labiale superius to stomion, mm. */
    upper: number;

    /** Lower vermilion height at the median, stomion to labiale inferius, mm. */
    lower: number;

    /** Cupid's bow: the upper edge's height at the crest over its height at the median, less one; 0 is no bow. Not published; the person's. */
    bow: number;

    /** The lips' line at the corner below the line at the median, mm. Not published; the person's. */
    fall: number;
  }

  /** The philtral crest's station as a share of the mouth's width: half of the published crest spacing, a quarter of the width. */
  export const CREST_SHARE: number = 0.125;

  /** The lips' line's height at a station: level at the median, the corner `fall` lower, a parabola between (declared). */
  export function line(mouth: IMouth, s: number): number {
    const t: number = Math.min(1, Math.abs((2 * s) / mouth.width));
    return -mouth.fall * t * t;
  }

  /**
   * The upper vermilion edge's height at a station. At the median it is the person's upper vermilion height above the line; it rises to
   * `(1 + bow)` times that at the crest by `1 - (1 - t^2)^2`, level at both the median and the crest, and from the crest it falls to the
   * lips' line at the corner by a parabola level at the crest (both declared).
   */
  export function upper(mouth: IMouth, s: number): number {
    const half: number = mouth.width / 2;
    const crest: number = CREST_SHARE * mouth.width;
    const x: number = Math.min(half, Math.abs(s));
    if (x <= crest) {
      const t: number = x / crest;
      return line(mouth, x) + mouth.upper * (1 + mouth.bow * (1 - (1 - t * t) ** 2));
    }
    const u: number = (x - crest) / (half - crest);
    return line(mouth, x) + mouth.upper * (1 + mouth.bow) * (1 - u * u);
  }

  /** The lower vermilion edge's height at a station: the person's lower vermilion height below the line at the median, falling to the line at the corner by a parabola (declared). */
  export function lower(mouth: IMouth, s: number): number {
    const t: number = Math.min(1, Math.abs((2 * s) / mouth.width));
    return line(mouth, s) - mouth.lower * (1 - t * t);
  }
}
