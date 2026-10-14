/**
 * Table-model body-fat estimate and the excess its definition gates consume.
 * Both quantities are percentages, with excess measured in percentage points
 * above the table's sex-conditioned essential-fat estimate. These derived
 * values retain the regression owner's qualification and are not observations.
 *
 * @evidence contracts/common.md#principled-implementation Estimated percent fat and percentage-point excess retain the table regression's distinct meanings.
 * @evidence contracts/common.md#clear-and-simple-design The derived reading separates total estimated fat from the excess consumed by definition gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither value is an observed individual's composition measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state percentage units and the age- and sex-conditioned model ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The derived fat readout is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The derived fat readout coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The derived fat readout type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export interface IHumanBodySimpleShapeFatReading {
  /** Body-fat estimate in percent from the table's age-conditioned model. */
  percent: number;

  /** Percentage-point excess above the table's essential-fat estimate. */
  excess: number;
}
