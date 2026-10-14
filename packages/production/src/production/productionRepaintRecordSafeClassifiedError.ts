import { AutoMovieRepaintRecordInspectionStage } from "./AutoMovieRepaintRecordInspectionStage";
import { AutoMovieRepaintRecordFailureClass } from "./AutoMovieRepaintRecordFailureClass";
import { AutoMovieRepaintRecordInspectionError } from "./AutoMovieRepaintRecordInspectionError";
import { productionRepaintRecordRecoveryFor } from "./productionRepaintRecordRecoveryFor";
import { productionRepaintRecordInspectionStages } from "./productionRepaintRecordInspectionStages";
import { productionRepaintRecordClassifiedFailures } from "./productionRepaintRecordClassifiedFailures";

/**
 * Recover only admitted nominal error classification, rebuilding recovery text from the supported failure class. Foreign errors, hostile prototype/property access and unsupported mutated stage/failure values return null; supported current field values are re-admitted, not compared to their original construction values. Error message and supplied recovery are never copied.
 *
 * @evidence contracts/common.md#principled-implementation Nominal instanceof and fresh set membership checks gate detached classification fields, with all hostile access inside an exception-to-null boundary.
 * @evidence contracts/common.md#clear-and-simple-design The predicate isolates classification payload policy from the collector's generic fallback and physical reader operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tampered recovery is ignored, invalid or throwing fields cannot become a classified success, and independent external getter effects are not rolled back.
 * @evidence contracts/common.md#meaningful-documentation Prose states nominal admission, null-on-hostile/foreign behavior and omitted message/recovery payloads.
 * @evidence contracts/performance.md#efficient-algorithms Nominal check, fixed recovery lookup and two set lookups use bounded record work beyond actual property-access effects; no error-message traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared supported sets and recovery spelling are reused while every mutable Error instance is re-admitted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a compact copied classification or null escapes; the Error/proxy and caught exception are not retained.
 */
export const productionRepaintRecordSafeClassifiedError: (error: unknown) => {
    stage: AutoMovieRepaintRecordInspectionStage;
    failure: AutoMovieRepaintRecordFailureClass;
    recovery: string;
} | null = (
  error: unknown,
): {
  stage: AutoMovieRepaintRecordInspectionStage;
  failure: AutoMovieRepaintRecordFailureClass;
  recovery: string;
} | null => {
  try {
    if (error instanceof AutoMovieRepaintRecordInspectionError === false)
      return null;
    const classified: { stage: AutoMovieRepaintRecordInspectionStage; failure: AutoMovieRepaintRecordFailureClass; recovery: string } = {
      stage: error.stage,
      failure: error.failure,
      recovery: productionRepaintRecordRecoveryFor(error.failure),
    };
    return productionRepaintRecordInspectionStages.has(classified.stage) &&
      productionRepaintRecordClassifiedFailures.has(classified.failure) &&
      classified.recovery.length > 0
      ? classified
      : null;
  } catch {
    return null;
  }
};
