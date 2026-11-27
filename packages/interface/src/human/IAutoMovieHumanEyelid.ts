import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Seated globe frames, sampled lid margins and lid-band rules with millimetre
 * and dimensionless quantities separated. Runtime construction and admission
 * remain with AutoMovieHumanEyelid in Human.
 */
export namespace IAutoMovieHumanEyelid {
  /** Evaluated margin of one eye. */
  export interface ILid {
    /** Aperture name, e.g. `eye.left`. */
    name: string;

    /** Seated globe. */
    globe: IGlobe;

    /** Samples at uniform phases. */
    samples: ISample[];

    /** Index of the medial canthus sample. */
    medial: number;

    /** Index of the lateral canthus sample. */
    lateral: number;
  }

  /** Seated globe frame in calibration mm. */
  export interface IGlobe {
    /** Centre of the scleral ellipsoid. */
    centre: AutoMovieVector3Tuple;

    /** Unit gaze direction, the aperture's `forward`. */
    forward: AutoMovieVector3Tuple;

    /** Unit up, orthogonal to `forward`. */
    up: AutoMovieVector3Tuple;

    /** Unit `forward x up`. */
    lateral: AutoMovieVector3Tuple;
  }

  /** One margin sample. */
  export interface ISample {
    /** Phase of the aperture series, radians. */
    phase: number;

    /** Posterior lid edge, on the globe where the globe lies behind it. */
    contact: AutoMovieVector3Tuple;

    /** Anterior lid edge, the lash line. */
    anterior: AutoMovieVector3Tuple;

    /** Unit direction across the margin away from the opening, in projection. */
    outward: AutoMovieVector3Tuple;

    /** Unit direction along increasing phase, in projection. */
    tangent: AutoMovieVector3Tuple;

    /** Distance of the contact point from the gaze axis, mm. */
    rho: number;

    /** Whether the sample belongs to the upper lid. */
    upper: boolean;

    /** Arc length to the nearer canthus, mm. */
    corner: number;

    /** Position along its lid: 0 at the medial canthus, 1 at the lateral. */
    position: number;

    /** Margin depth from posterior to anterior edge, mm. */
    thickness: number;
  }

  /**
   * Lid rule constants in mm.
   *
   * - `band`: width, measured across the margin in projection, of the skin the
   *   lid band replaces outside the contact line. The lofted skin there
   *   reproduces the reference's inward roll into the conjunctival sac only
   *   coarsely, so the band rebuilds the last millimetres of the lid by rule.
   * - `upper`, `lower`: depth of the lid margin along the line of sight, from the
   *   contact line to the anterior edge, for each lid. The margin is about 2 mm
   *   wide (anterior lamella with the lashes to the posterior edge on the eye,
   *   Gray 1918) and inclined to the line of sight; the reference's anterior
   *   lid edge lies 0.6 to 1.1 mm in front of its contact line.
   * - `offset`: how far the anterior edge lies outward of the posterior edge in
   *   projection.
   * - `taper`: arc length from a canthus over which the margin depth grows from
   *   `merge` of its full value; the lids thin where they meet.
   * - `gap`: clearance of the posterior edge off the globe surface.
   * - `clearance`: least lid thickness over the globe across the band.
   */
  export type IRule = {
    /**
     * Projected width of rebuilt lid skin outside the contact line,
     * millimetres.
     */
    band: number;
    /** Upper-lid margin depth along the line of sight, millimetres. */
    upper: number;
    /** Lower-lid margin depth along the line of sight, millimetres. */
    lower: number;
    /**
     * Projected outward displacement of the anterior edge from the posterior
     * edge, millimetres.
     */
    offset: number;
    /**
     * Arc length from a canthus over which margin depth reaches its full value,
     * millimetres.
     */
    taper: number;
    /** Fraction of full lid depth retained at the canthus, dimensionless. */
    merge: number;
    /** Posterior-edge clearance above the eye-globe surface, millimetres. */
    gap: number;
    /**
     * Minimum lid thickness over the eye globe across the rebuilt band,
     * millimetres.
     */
    clearance: number;
  };
}
