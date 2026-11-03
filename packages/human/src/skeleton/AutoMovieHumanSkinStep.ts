/**
 * The steps a skin share climbs on from one bone to the next.
 *
 * A share's stretch follows its steepest slope, so a limb's transition climbs
 * on `slide`, whose slope is level over its middle and eases in and out on
 * cubic shoulders: flat to the second derivative at both ends, with a peak
 * slope of `1 / (1 - GLIDE)` of the mean against 15/8 for the quintic step.
 * The jaw and the head keep the quintic `ramp` their cuts were sized on.
 */
export namespace AutoMovieHumanSkinStep {
  /**
   * Share of each half of the `glide` step spent easing in or out. A quarter
   * keeps the peak slope at 4/3 of the mean while the share's curvature at the
   * ends stays within twice the quintic's (convention).
   */
  export const GLIDE: number = 0.25;

  /** Peak slope of the `slide` step per half width, `1 / (2 (1 - GLIDE))` (derived from `glide`). */
  export const SLOPE: number = 1 / (2 * (1 - GLIDE));

  /** Share of a ramp's half width over which the slope is level, `1 - 2 GLIDE` (derived from `glide`). */
  export const LEVEL: number = 1 - 2 * GLIDE;

  /** A quintic step from 0 at -1 to 1 at 1, flat to the second derivative at both. */
  export function ramp(x: number): number {
    return rise((x + 1) / 2);
  }

  /** A quintic step from 0 at 0 to 1 at 1, flat to the second derivative at both. */
  export function rise(x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x * x * x * (x * (6 * x - 15) + 10);
  }

  /** A limb's step from 0 at -1 to 1 at 1, see {@link glide}. */
  export function slide(x: number): number {
    return glide((x + 1) / 2);
  }

  /** A step from 0 at 0 to 1 at 1 with a level middle and cubic shoulders. */
  export function glide(x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (x > 0.5) return 1 - glide(1 - x);
    const level: number = 1 / (1 - GLIDE);
    if (x >= GLIDE) return level * (GLIDE / 2 + x - GLIDE);
    const u: number = x / GLIDE;
    return level * GLIDE * u * u * u * (1 - u / 2);
  }
}
