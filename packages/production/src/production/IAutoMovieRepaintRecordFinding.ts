import { IAutoMovieRepaintRecordTarget } from "./IAutoMovieRepaintRecordTarget";
import { AutoMovieRepaintRecordInspectionStage } from "./AutoMovieRepaintRecordInspectionStage";
import { AutoMovieRepaintRecordFailureClass } from "./AutoMovieRepaintRecordFailureClass";

/**
 * One target/stage/class refusal with built-in recovery text from the inspection collector. Arbitrary reader exception messages are omitted; independently supplied target identity remains visible and requires its owning source's safe identity policy.
 *
 * @evidence contracts/common.md#principled-implementation Separate target, stage and failure fields preserve the refused operation while derived recovery text avoids copying arbitrary provider/filesystem error payloads.
 * @evidence contracts/common.md#clear-and-simple-design Compact diagnostic data stays separate from returned record values and reader exceptions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape alone enforces no sanitization, and visible target text is not certified secret-free by merely using this type.
 * @evidence contracts/common.md#meaningful-documentation Members give identity, stage, classification and collector-derived recovery ownership with the omitted-error-message boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no exception conversion or recovery lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Finding identity implements no error/result cache or cross-reader coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased interface acquires no error payload, record bytes or running reader.
 * @author Samchon
 */
export interface IAutoMovieRepaintRecordFinding {
  /** The record the finding is about. */
  target: IAutoMovieRepaintRecordTarget;

  /** Inspection stage that produced the finding. */
  stage: AutoMovieRepaintRecordInspectionStage;

  /** Classified failure, carrying no record or provider bytes. */
  failure: AutoMovieRepaintRecordFailureClass;

  /** Safe recovery sentence a caller may show as is. */
  recovery: string;
}
