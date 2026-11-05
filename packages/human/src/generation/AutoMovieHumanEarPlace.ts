import type { IAutoMovieHumanEar } from "../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * The ear's place on the head: how far the auricle's top stands above the
 * tragion, which with the tragion's own height (`AutoMovieHumanHeadArcs.tragionDrop`)
 * places the ear, replacing the head prior's observed `ear.drop`; its
 * fore-aft place ({@link FORWARD}, for `ear.forward`) and the concha's depth
 * ({@link CONCHA_ON_PROTRUSION}) are reference estimates.
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

  /**
   * The ear's fore-aft place at the tragion's height, forward of the skull's
   * centre (the midpoint of the midline's front and back where they stand
   * farthest apart) per head length: the rim's most anterior point and the
   * mean of the rim's points. Estimated from the private reference set; no
   * published source found: `test_human_estimate_nasion_ear` reads -0.0996
   * (SD 0.0068) and -0.1406 (SD 0.0215) on eight ears of four people.
   */
  export const FORWARD: { readonly front: number; readonly centre: number } = { front: -0.0996, centre: -0.1406 };

  /**
   * The concha's depth inside the rim per ear protrusion. Estimated from the
   * private reference set; no published source found:
   * `test_human_estimate_face_detail` reads 1.058 (SD 0.096) on eight ears.
   */
  export const CONCHA_ON_PROTRUSION: number = 1.058;

  /**
   * The ear's fore-aft place at the tragion's height.
   *
   * @param head The head's measures, for its length.
   * @returns The rim's front and centre forward of the skull's centre, mm (negative behind it).
   */
  export function forward(head: IAutoMovieHumanHeadIdentity): { front: number; centre: number } {
    return { front: FORWARD.front * head.length, centre: FORWARD.centre * head.length };
  }

  /**
   * The concha's depth inside the rim.
   *
   * @param ear The ear's measures.
   * @returns Depth from the rim inward, mm.
   */
  export function concha(ear: IAutoMovieHumanEar): number {
    return CONCHA_ON_PROTRUSION * ear.protrusion;
  }
}
