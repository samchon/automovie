/**
 * Reports scalar coverage and numerical rank across reference identities.
 * Residual degrees of freedom are row count minus rank, not a confidence
 * interval; neither rank nor observed ranges certify population support.
 *
 * @evidence contracts/common.md#principled-implementation Keeps missing observations, training-only rank and reserved identity counts explicit without inferring unobserved dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Describes one study result without fitted coefficients or geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no built-in identities, measurement bounds or acceptance thresholds.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes descriptive ranges and algebraic residual degrees of freedom from population evidence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type selects no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type acquires no resources.
 */
export interface CalibrationCoverage {
  /** Declared distinct canonical source identities; hashes do not prove unrelated biological subjects. */
  distinctIdentities: number;
  /** Previously exposed identities used for model-design calculations. */
  trainingIdentities: number;
  /** Untouched identities excluded from model-design calculations. */
  reservedIdentities: number;
  /** Descriptive observed and training ranges, with null endpoints when absent. */
  dimensions: {
    id: string;
    unit: string;
    observed: number;
    missing: string[];
    minimum: number | null;
    maximum: number | null;
    trainingMinimum: number | null;
    trainingMaximum: number | null;
  }[];
  /** Complete training row membership and explicitly thresholded numerical rank. */
  models: {
    id: string;
    trainingRows: string[];
    omittedTrainingRows: string[];
    featureCount: number;
    rank: number;
    nullity: number;
    residualDegreesOfFreedom: number;
    numericalCutoff: number;
    zeroVariationDimensions: string[];
  }[];
}
