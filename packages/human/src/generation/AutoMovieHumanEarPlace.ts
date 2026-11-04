import type { IAutoMovieHumanEar } from "../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The ear's height on the head: how far the auricle's top stands above the
 * tragion, which with the tragion's own height (`AutoMovieHumanHeadArcs.tragionDrop`)
 * places the ear, replacing the head prior's observed `ear.drop`.
 *
 * Source: ANSUR 1988 (Gordon et al. 1989; 2,208 women and 1,774 men) takes the
 * ear length above tragion with the ear length; the line by sex
 * (`test_human_survey_head_arcs`): 6.96 + 0.3645 L in women and 8.12 + 0.3673
 * L in men, R2 0.34 and 0.40, residual SD 1.9 mm; the means are 28.7 (2.3)
 * and 31.9 (2.5) mm.
 */
export namespace AutoMovieHumanEarPlace {
  /** The line on the ear length, women and men, mm. */
  export const ABOVE_TRAGION_ON_LENGTH: readonly [{ readonly a: number; readonly b: number }, { readonly a: number; readonly b: number }] = [
    { a: 6.96, b: 0.3645 },
    { a: 8.12, b: 0.3673 },
  ];

  /**
   * The ear's top above the tragion.
   *
   * @param ear The ear's measures.
   * @param sex The person's sex.
   * @returns Height of the auricle's top over the tragion, mm.
   */
  export function aboveTragion(ear: IAutoMovieHumanEar, sex: AutoMovieHumanSex): number {
    const fit: { readonly a: number; readonly b: number } = ABOVE_TRAGION_ON_LENGTH[sex === AutoMovieHumanSex.Female ? 0 : 1];
    return fit.a + fit.b * ear.length;
  }
}
