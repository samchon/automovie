/** A pelvis and thigh share one monotone C2 approach to their common ring. */
export namespace AutoMovieHumanPelvisGuide {
  /** Position and its first two physical-station derivatives. */
  export interface IJet {
    /** Coordinate in millimetres. */
    value: number;

    /** Coordinate derivative in millimetres per millimetre. */
    first: number;

    /** Coordinate curvature in inverse millimetres. */
    second: number;
  }

  /**
   * Join two corresponding coordinates without an interior reversal.
   * Constant continuation at either end shares value, tangent and curvature.
   * The guide owns a shape coordinate, not a corrective displacement whose
   * derivative could oppose the anatomy a few millimetres beyond the seam.
   */
  export function coordinate(from: number, to: number, start: number, end: number, station: number): IJet {
    if (!(end > start)) throw new Error("A pelvis guide needs positive length");
    const t: number = Math.max(0, Math.min(1, (station - start) / (end - start)));
    const gap: number = to - from;
    const w: number = t ** 3 * (10 + t * (-15 + 6 * t));
    return {
      value: from + gap * w,
      first: gap * 30 * t ** 2 * (1 - t) ** 2 / (end - start),
      second: gap * 60 * t * (1 - t) * (1 - 2 * t) / (end - start) ** 2,
    };
  }
}
