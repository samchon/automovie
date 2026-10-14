import type { IAutoMovieHumanBodySimpleShapeFatRegression } from "./IAutoMovieHumanBodySimpleShapeFatRegression";

/**
 * Deurenberg's two body fat regressions, the age interval between them and
 * the fat the definition gates subtract.
 *
 * @evidence contracts/common.md#principled-implementation Separate pediatric and adult regression records and an authored transition define estimated fat and the additional muscle correction used for definition.
 * @evidence contracts/common.md#clear-and-simple-design Regression coefficients remain separate from essential-fat and training-effect curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interpolation interval and muscle correction are authored modeling choices, not fitted individual body-composition measurements.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes percent fat, sex-indexed points and fat-free mass index units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The fat estimation table declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fat estimation table schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fat estimation table type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeFat {
  /** The regression for children. */
  pediatric: IAutoMovieHumanBodySimpleShapeFatRegression;

  /** The regression for adults. */
  adult: IAutoMovieHumanBodySimpleShapeFatRegression;

  /** Authored interpolation interval; the study reports separate age domains. */
  transitionAgeYears: [number, number];

  /** Essential fat percent over sex, as `[sex, percent]` points. */
  essentialBySex: [number, number][];

  /**
   * Fat-free mass index (kg/m²) one unit of the muscle parameter adds over
   * the regression's body at the same stature and mass, by sex: the fat
   * the definition gates read is the regression's less the mass that
   * muscle displaces (`100 · Δ · developedMuscle / BMI` points, using the
   * authored age-conditioned training ramp). Deurenberg's
   * regression knows no muscularity, so without this an athlete reads the
   * fat of an untrained body of the same mass index.
   */
  muscleFatFreeMassIndex: [number, number][];
}
