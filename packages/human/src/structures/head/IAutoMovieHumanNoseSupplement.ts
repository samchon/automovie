/** Nasal section dimensions. */
export interface IAutoMovieHumanNoseSupplement {
  /** Posterior nasal-root offset relative to the facial profile, mm. */
  rootRecessionMm: number;

  /** Anterior tip rise above the nasal section baseline, mm. */
  tipRiseMm: number;

  /** Transverse diameter of the nostril oval, mm. */
  nostrilBreadthMm: number;

  /** Second diameter of the nostril oval in its own tilted plane, mm. */
  nostrilHeightMm: number;

  /** Orientation of the nostril plane in the nasal measurement chart, degrees. */
  nostrilPlaneDegrees: number;

  /** Recession angle of the nostril axis in that chart, degrees. */
  nostrilRecessionDegrees: number;
}
