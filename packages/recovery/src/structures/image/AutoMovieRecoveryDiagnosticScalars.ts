import type { IAutoMovieRecoveryDiagnosticNumber } from "./IAutoMovieRecoveryDiagnosticNumber";

/**
 * Preserve fixed report members while making their numbers JSON-safe.
 * This type is instantiated for the existing direction, SQP/tightening and
 * trial records, which contain scalars and one fixed nested record, no arrays.
 * Inherited field meanings and units remain those of the original report.
 *
 * @evidence contracts/common.md#principled-implementation A mapped representation changes number serialization only; nullable absence, fixed strings and booleans retain their original semantics.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the three actual report shapes instead of maintaining divergent duplicate member inventories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runtime producer still enumerates supported fields explicitly and does not traverse arbitrary input objects or expose state/arrays.
 * @evidence contracts/common.md#meaningful-documentation Defines its supported fixed records and preservation of source-member units, nulls and reasons.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased mapping performs no runtime traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It acquires no value or resource.
 */
export type AutoMovieRecoveryDiagnosticScalars<Report> = Report extends number
  ? IAutoMovieRecoveryDiagnosticNumber
  : Report extends object
    ? { [Key in keyof Report]: AutoMovieRecoveryDiagnosticScalars<Report[Key]> }
    : Report;
