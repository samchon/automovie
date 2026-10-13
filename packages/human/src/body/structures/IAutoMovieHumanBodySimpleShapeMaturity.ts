/**
 * Authored age ramp for the simple-shape model's training contribution.
 * The factor is zero before `startAgeYears`, one from `endAgeYears` and
 * linear between, with both endpoints interpolated over sex. This is the
 * table owner's numerical bridge, not a measurement of an individual's
 * capacity or evidence that training produces no muscle before an endpoint.
 *
 * @evidence contracts/common.md#principled-implementation Two sex-indexed age curves delimit a linear authored training ramp with zero and one endpoint factors.
 * @evidence contracts/common.md#clear-and-simple-design The ramp schema leaves the shared arithmetic owner responsible for interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numerical bridge does not assert absence of muscle response before its start or individual maturity.
 * @evidence contracts/common.md#meaningful-documentation Members state years and sex interpolation; prose distinguishes an authored factor from physiological measurement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The training maturity ramp declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The training maturity ramp schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The training maturity ramp type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMaturity {
  /** Age in years at which the ramp starts, as `[sex, years]` points. */
  startAgeYears: [number, number][];

  /** Age in years at which the ramp ends, as `[sex, years]` points. */
  endAgeYears: [number, number][];
}
