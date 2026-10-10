/**
 * Authored age ramp for the simple-shape model's training contribution.
 * The factor is zero before `startAgeYears`, one from `endAgeYears` and
 * linear between, with both endpoints interpolated over sex. This is the
 * table owner's numerical bridge, not a measurement of an individual's
 * capacity or evidence that training produces no muscle before an endpoint.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMaturity {
  /** Age in years at which the ramp starts, as `[sex, years]` points. */
  startAgeYears: [number, number][];

  /** Age in years at which the ramp ends, as `[sex, years]` points. */
  endAgeYears: [number, number][];
}
