import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The leg's surveyed sites and depth: where the calf's greatest girth stands,
 * and the thigh's depth at its tape site.
 *
 * Calf site: ANSUR 1988 (Gordon et al. 1989; 2,208 women and 1,774 men)
 * takes the calf height, the floor to the level of the calf circumference
 * (the ISO 8559-1 5.3.24 site), with the lateral malleolus and mid-patella
 * heights on the same subjects: the calf's level stands at {@link CALF_SHARE}
 * of the way from the lateral malleolus up to mid-patella
 * (`test_human_survey_calf_site`).
 *
 * Thigh depth: the thigh clearance, the one limb depth the surveys take,
 * sitting with the thigh horizontal, from the seat to the thigh's highest
 * point (ANSUR 1988 `THIGH_CLEARANCE`), on the proximal thigh girth just below
 * the gluteal furrow (`THIGH_CIRC-PROXIMAL`, the Human's `thighCircumference`):
 * {@link THIGH_DEPTH_ON_THIGH} (`test_human_survey_thigh_depth`). Its limit:
 * the thigh rests on the seat, so the reading is the seated, compressed depth,
 * 0.862 and 0.887 of the depth a circle of the same girth would have.
 */
export namespace AutoMovieHumanLegSites {
  /** The calf level's share of the lateral malleolus to mid-patella span, women and men: 0.6414 (SD 0.0345) and 0.6537 (0.0269). */
  export const CALF_SHARE: readonly [number, number] = [0.6414, 0.6537];

  /** Thigh clearance on the proximal thigh girth, women and men, mm: R2 0.66 and 0.74, residual SD 7.0 and 6.4 mm. */
  export const THIGH_DEPTH_ON_THIGH: readonly [{ readonly a: number; readonly b: number }, { readonly a: number; readonly b: number }] = [
    { a: 32.27, b: 0.2183 },
    { a: 37.12, b: 0.2197 },
  ];

  /**
   * The calf's greatest girth's height.
   *
   * @param measures A person's resolved measures, for the sex.
   * @param malleolus Lateral malleolus height, mm.
   * @param patella Mid-patella height, mm.
   * @returns The calf level above the floor, mm.
   */
  export function calf(measures: IAutoMovieHumanBodyMeasures, malleolus: number, patella: number): number {
    return malleolus + CALF_SHARE[measures.sex === AutoMovieHumanSex.Female ? 0 : 1] * (patella - malleolus);
  }

  /**
   * The thigh's depth at its tape site, seated and compressed as the survey
   * takes it.
   *
   * @param measures A person's resolved measures: the sex and the thigh girth.
   * @returns The thigh's depth, mm.
   */
  export function thighDepth(measures: IAutoMovieHumanBodyMeasures): number {
    const fit: { readonly a: number; readonly b: number } = THIGH_DEPTH_ON_THIGH[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    return fit.a + fit.b * measures.thighCircumference;
  }
}
