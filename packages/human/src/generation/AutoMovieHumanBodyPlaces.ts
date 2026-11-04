import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The body frame's forward places of cervicale and the perineum, relative to
 * the midpoint of the two ankles, standing: where the back profile and the
 * trunk's lower pole stand over the feet.
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_body_places` reads the reference curves'
 * horizontal sections and aggregates, over the people where the site reads,
 * each place's forward offset from the midpoint of the two ankle loops'
 * centres over stature: cervicale's skin (at ANSUR II's cervicale share of
 * stature, the most posterior skin within 15 mm of the median plane) at
 * -0.0261 (SD 0.0050) of stature over two people, the perineum (the median
 * chord's midpoint of the lowest trunk section) at 0.0261 (SD 0.0339) over
 * three. The skeleton route (the C7 plumb line by the sagittal vertical axis,
 * the sacrum by the pelvic angles, the hip axis) needs vertebral and pelvic
 * morphometry no reachable source gave (`docs/work/log-inputs.md`).
 *
 * Limits: two or three people; the perineum's spread is as large as its mean,
 * so its place is barely more than the ankles' own; the replacement stays
 * open.
 */
export namespace AutoMovieHumanBodyPlaces {
  /** Cervicale's skin forward of the ankles' midpoint, per stature (negative: behind). */
  export const CERVICALE: number = -0.0261;

  /** The perineum forward of the ankles' midpoint, per stature. */
  export const PERINEUM: number = 0.0261;

  /**
   * Cervicale's skin forward of the ankles' midpoint.
   *
   * @param measures A person's resolved measures, for stature.
   * @returns Forward offset, mm (negative: behind).
   */
  export function cervicale(measures: IAutoMovieHumanBodyMeasures): number {
    return CERVICALE * measures.stature;
  }

  /**
   * The perineum forward of the ankles' midpoint.
   *
   * @param measures A person's resolved measures, for stature.
   * @returns Forward offset, mm.
   */
  export function perineum(measures: IAutoMovieHumanBodyMeasures): number {
    return PERINEUM * measures.stature;
  }
}
