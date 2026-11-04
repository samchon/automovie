/**
 * The temporal peak, centred on the line from the frontotemporal point down
 * to the lateral canthus: 5/8 of the way from the point C to the canthus E
 * (Garg 2017's rule of eight, CD 5 cm of CE 8 cm on the skin), so it stands
 * at 3/8 of C's height above the eyes. The boundary is a height per azimuth,
 * which cannot point forward, so the peak is placed {@link PEAK} degrees
 * behind C as the temple's knot rather than as a forward point.
 */
export namespace AutoMovieHumanHairlineTemporalPeak {
  /** Share of the frontotemporal point's height at the temporal peak (Garg 2017, measured means). */
  export const SHARE: number = 3 / 8;

  /**
   * Azimuth of the temporal peak behind the frontal line's end, degrees
   * (convention: the boundary is a height per azimuth and cannot point
   * forward, so the peak is placed this far behind the apex; no published
   * value).
   */
  export const PEAK: number = 14;

  /** Least azimuth of the peak, degrees (convention: behind the temple's front edge). */
  export const LEAST: number = 64;

  /**
   * The peak's knot `[azimuth degrees, height above the eyes mm]`.
   *
   * @param corner The frontal line's lateral end `[degrees, height]`
   * @returns The knot
   */
  export function knot(corner: [number, number]): [number, number] {
    return [Math.max(LEAST, corner[0] + PEAK), SHARE * corner[1]];
  }
}
