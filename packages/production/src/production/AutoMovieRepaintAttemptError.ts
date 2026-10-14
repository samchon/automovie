import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * Carries a classified adapter refusal, original Error message, default zero cost, nullable available-output metadata and optional runtime raw output.
 *
 * @evidence contracts/common.md#principled-implementation Carries a classified adapter refusal, original Error message, default zero cost, nullable available-output metadata and optional runtime raw output.
 * @evidence contracts/common.md#clear-and-simple-design The existing Error subtype carries provider failure/cost/partial output across service and executor boundaries without coupling classification to raw publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Raw output can retain provider bytes until the service quarantines them; the error does not publish a candidate or validate the disclosure.
 * @evidence contracts/performance.md#efficient-algorithms Construction invokes Error and assigns parameter properties in the original order; classification/retention occur at executor and service seams.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Raw output can retain provider bytes until the service quarantines them; the error does not publish a candidate or validate the disclosure.
 */
export class AutoMovieRepaintAttemptError extends Error {
  /** Assigns the original classified cause/cost/nullable output/raw bytes after Error(message), preserving zero/null/undefined defaults without validation. */
  public constructor(
    /** Gives the refusal a durable failure class. */
    public readonly failureClass: AutoMovieRepaintFailureClass,
    message: string,
    /** Charges failed provider work to the budget. */
    public readonly costUnits: number = 0,
    /** Preserves a partial digest without accepting it. */
    public readonly availableOutput: IAutoMovieRepaintAttemptOutput | null = null,
    /** Runtime-only bytes the host must quarantine before journaling this error. */
    public readonly rawOutput?: { bytes: Uint8Array; mediaType: string },
  ) {
    super(message);
  }
}
