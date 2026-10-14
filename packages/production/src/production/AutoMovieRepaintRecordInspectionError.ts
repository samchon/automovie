import { AutoMovieRepaintRecordInspectionStage } from "./AutoMovieRepaintRecordInspectionStage";
import { AutoMovieRepaintRecordFailureClass } from "./AutoMovieRepaintRecordFailureClass";
import { productionRepaintRecordInspectionStages } from "./productionRepaintRecordInspectionStages";
import { productionRepaintRecordClassifiedFailures } from "./productionRepaintRecordClassifiedFailures";
import { productionRepaintRecordRecoveryFor } from "./productionRepaintRecordRecoveryFor";

/**
 * Classified refusal thrown by one physical repaint-record reader.
 *
 * The collector omits this error's message and reconstructs built-in recovery text from an admitted failure class. Stage/failure are readonly TypeScript fields, not runtime-frozen; the collector re-admits them and ignores an overwritten recovery value. This isolates the error payload, not independently supplied target text or external callback effects.
 *
 * @evidence contracts/common.md#principled-implementation Constructor stage/failure membership checks establish a classified Error with owner-defined recovery, and the collector independently rechecks fields before publishing a finding.
 * @evidence contracts/common.md#clear-and-simple-design One nominal error carries reader classification while the collector owns payload omission and recovery reconstruction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Foreign classification values throw instead of leaking into findings; readonly fields are not presented as runtime immutability or universal target sanitization.
 * @evidence contracts/common.md#meaningful-documentation Prose gives allowed classification, nominal error ownership, omitted message and runtime-tampering boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Construction performs two fixed-set lookups and a fixed recovery lookup plus ordinary Error/message allocation; no persisted record or provider payload is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work All errors share module classification sets and the built-in recovery owner; each thrown instance remains distinct and is re-admitted by the collector.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller/throw handling owns the Error and its runtime stack/message; the class stores only classification/recovery and starts no reader, timer or file handle.
 */
export class AutoMovieRepaintRecordInspectionError extends Error {
  /** Built-in safe recovery sentence for the classified failure. */
  public readonly recovery: string;

  /** Construct a classified refusal or throw when its stage/failure is outside the supported sets; no arbitrary provider payload is accepted. */
  public constructor(
    /** Inspection stage the reader was in when it refused. */
    public readonly stage: AutoMovieRepaintRecordInspectionStage,

    /** Classified failure the reader refused with. */
    public readonly failure: AutoMovieRepaintRecordFailureClass,
  ) {
    super(`Repaint ${stage} inspection failed as ${failure}.`);
    if (
      productionRepaintRecordInspectionStages.has(stage) === false ||
      productionRepaintRecordClassifiedFailures.has(failure) === false
    )
      throw new Error("Repaint inspection refusal is malformed.");
    this.recovery = productionRepaintRecordRecoveryFor(failure);
  }
}
