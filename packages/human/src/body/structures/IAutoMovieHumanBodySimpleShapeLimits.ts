/**
 * The inclusive envelope of each simple parameter, the optional ones included.
 *
 * @evidence contracts/common.md#principled-implementation Inclusive two-number intervals specify each supported simple parameter's authored envelope; admission performs the actual comparisons.
 * @evidence contracts/common.md#clear-and-simple-design Required and optional parameter limits share one complete table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These intervals constrain the model's inputs and do not certify every combination as a living body.
 * @evidence contracts/common.md#meaningful-documentation The members identify the parameter each inclusive interval constrains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The simple parameter envelope table declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The simple parameter envelope table schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The simple parameter envelope table type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeLimits {
  /** Inclusive envelope of `sex`. */
  sex: [number, number];

  /** Inclusive envelope of `ageYears`. */
  ageYears: [number, number];

  /** Inclusive envelope of `statureMetres`. */
  statureMetres: [number, number];

  /** Inclusive envelope of `massKilograms`. */
  massKilograms: [number, number];

  /** Inclusive envelope of `muscle`. */
  muscle: [number, number];

  /** Inclusive envelope of `waistMetres`. */
  waistMetres: [number, number];

  /** Inclusive envelope of `hipsMetres`. */
  hipsMetres: [number, number];

  /** Inclusive envelope of `bustMetres`. */
  bustMetres: [number, number];

  /** Inclusive envelope of `shoulderMetres`. */
  shoulderMetres: [number, number];

  /** Inclusive envelope of `thighMetres`. */
  thighMetres: [number, number];

  /** Inclusive envelope of `upperArmMetres`. */
  upperArmMetres: [number, number];

  /** Inclusive envelope of `calfMetres`. */
  calfMetres: [number, number];
}
