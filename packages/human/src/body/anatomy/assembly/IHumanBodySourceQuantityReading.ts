import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Actual source-boundary quantity and its independent raw anatomical record.
 *
 * @evidence contracts/common.md#principled-implementation A source-bound path keeps an owned target/acquisition record distinct from source-rest, export-precision and final posed mL readings.
 * @evidence contracts/common.md#clear-and-simple-design Optional precision stages and solved coefficient remain explicit so acquisition availability is not conflated with achieved target geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Input kinds are never converted, and null measurements preserve undefined acquisition comparison rather than inventing numerical agreement.
 * @evidence contracts/common.md#meaningful-documentation Fields explain mL units, null versus absent stages, target-only coefficient and named source/acquisition qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Quantity reports hold already measured values without choosing integration or target-solve algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Precision-stage readings are outputs, not a cache invalidation policy for later geometry changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The report contains scalar readings and an owned input record without acquiring measurement resources.
 * @author Samchon
 */
export interface IHumanBodySourceQuantityReading {
  /** Existing anatomical record path consumed by its source binding. */
  path: string;

  /** Owned raw target or acquisition record, never converted between kinds. */
  input: IAutoMovieHumanBodyAnatomicalVolume;

  /** Measured source boundary volume in mL, or null if acquisition comparison is undefined. */
  sourceMillilitres: number | null;

  /** Float32 source boundary volume in mL before posing; null for an undefined acquisition comparison. */
  sourceFloat32Millilitres?: number | null;

  /** Actual posed output boundary volume in mL at export precision; absent before final geometry is emitted. */
  finalFloat32Millilitres?: number | null;

  /** Source field coefficient for an achieved target; absent for raw observation. */
  coefficient?: number;

  /** Named source/acquisition availability or coarse authoring qualification. */
  qualification: string;
}
