import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";

/**
 * The parting a style declares: the line on the top of the head from which
 * the hair is combed to either side.
 *
 * A bob is parted at the midline; a short cut at a fifth of the chart
 * radius toward the person's left (+Z), the style's one declared break of
 * the head's mirror symmetry; a crop has no parting. Strands on either side
 * meet a side value ramped linearly across {@link BAND} of the chart's unit
 * radius either way (about 1 mm on an adult scalp) instead of a switching
 * sign, so a strand whose path grazes the line meets a continuous field
 * rather than one flipping it back and forth, which zigzags and twists its
 * card. How much scalp the parting shows is not set here: it follows the
 * coverage law (`AutoMovieHumanHairOcclusion`) through the scalp layer and
 * the short root bands inside the mass (`AutoMovieHumanHairRootBand`).
 */
export namespace AutoMovieHumanHairParting {
  /** Half-width of the side ramp in chart units (convention: about 1 mm on an adult scalp, so the field is continuous across the line). */
  export const BAND: number = 0.01;

  /**
   * Lateral chart coordinate of a style's parting.
   *
   * @param style Haircut
   * @returns Offset toward +Z in unit-sphere coordinates, null without one
   */
  export function offset(style: AutoMovieHumanHairStyle): number | null {
    if (style === AutoMovieHumanHairStyle.Bob) return 0;
    if (style === AutoMovieHumanHairStyle.Short) return 0.2;
    return null;
  }

  /**
   * Side of the parting at a chart direction.
   *
   * @param style Haircut with a parting
   * @param u Unit chart direction
   * @returns Side in `[-1, 1]`, positive toward +Z
   */
  export function side(
    style: AutoMovieHumanHairStyle,
    u: [number, number, number],
  ): number {
    const at: number = offset(style) ?? 0;
    return Math.max(-1, Math.min(1, (u[2] - at) / BAND));
  }
}
