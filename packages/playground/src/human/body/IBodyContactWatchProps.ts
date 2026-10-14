import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Viewport and transaction operations used by the body's delayed contact reader. The panel owns document intent; each measured frame must be retired through its actual viewport before its reading is reported.
 *
 * @evidence contracts/common.md#principled-implementation Numerical preparation, physical frame retirement and intent validity are injected from their owning operations so delayed inspection cannot bypass body transaction or cleanup authority.
 * @evidence contracts/common.md#clear-and-simple-design The watch receives only measured build, disposal, retirement settlement and status hooks rather than the full editor or renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspection uses the consumer's actual viewport operations without test schedulers, patched globals or a fabricated cleanup completion.
 * @evidence contracts/common.md#meaningful-documentation The comment locates document-intent ownership and requires actual measured-frame retirement before reporting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These injected services choose no crossing-inspection or scheduling algorithm themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The dependency record implements no cache or sharing of measured frames across intents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed viewport callbacks acquire no resources here; the watch owns its timer and the viewport owns measured frames.
 *
 * @author Samchon
 */
export interface IBodyContactWatchProps<Model> {
  /**
   * Prepare the requested document with crossing inspection enabled.
   *
   * @evidence contracts/common.md#principled-implementation Contact inspection uses the same document build seam as explicit viewport checks, with measurement requested explicitly.
   * @evidence contracts/common.md#clear-and-simple-design Preparation returns a measured model while publication remains outside the contact reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A measured build is not replaced by a stored contact answer for the document.
   * @evidence contracts/common.md#meaningful-documentation The member identifies document preparation and explicit crossing-inspection enablement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This measured-build signature delegates geometry and crossing algorithms to the viewport's numerical owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No shared measured-frame cache is declared by this injected build operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared models remain viewport-owned until the watch requests their disposal and settlement.
   */
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
    measure: boolean,
  ) => Promise<Model>;

  /**
   * Request retirement of the inspection frame without publishing it.
   *
   * @evidence contracts/common.md#principled-implementation A measured frame is temporary observation output and is disposed instead of replacing the committed display.
   * @evidence contracts/common.md#clear-and-simple-design The watch retires the model through its viewport callback without inspecting renderer handles.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requesting disposal is not represented as proof that asynchronous cleanup completed.
   * @evidence contracts/common.md#meaningful-documentation The operation comment identifies inspection-frame retirement and absence of publication.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This disposal signature chooses no renderer resource traversal or release order.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frame cleanup is an ownership effect with no shared numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplied viewport disposer owns the frame handles; settlement exposes the completion boundary.
   */
  dispose: (model: Model) => void;

  /**
   * Await actual viewport retirement requests and propagate cleanup failures.
   *
   * @evidence contracts/common.md#principled-implementation Retirement settlement observes actual disposal outcomes rather than inferring release from a delay.
   * @evidence contracts/common.md#clear-and-simple-design The watch awaits one viewport-owned cleanup boundary without duplicating its retirement queue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup failures are not hidden by a timer-based successful completion guess.
   * @evidence contracts/common.md#meaningful-documentation The comment states actual retirement observation and cleanup-failure propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This settlement member implements no disposal-queue scheduling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The promise declares no cross-viewport reuse of cleanup completion.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The viewport retains cleanup-task ownership until its exposed settlement completes.
   */
  settleRetirements: () => Promise<void>;

  /**
   * Whether the body intent still permits this reading's status effect.
   *
   * @evidence contracts/common.md#principled-implementation Shared intent validity binds delayed contact output to the document whose editing pause scheduled it.
   * @evidence contracts/common.md#clear-and-simple-design A predicate keeps all body-edit ordering in the parent transaction owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal pose or elapsed time is not used as proof that an inspection remains current.
   * @evidence contracts/common.md#meaningful-documentation The member identifies ticket validity as permission for reading-status effects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This contact-ticket signature chooses no intent-counter implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Effect validity establishes ordering rather than reusable numerical equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ticket inspection owns no frame, worker or running measurement task.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Append current inspection or refusal text to the owning body status.
   *
   * @evidence contracts/common.md#principled-implementation The existing body status receives numerical observation or refusal without the reader owning a separate committed state.
   * @evidence contracts/common.md#clear-and-simple-design A text sink keeps UI composition in the parent while the watch formats contact meaning.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports preserve unavailable and failed inspection instead of substituting a successful contact claim.
   * @evidence contracts/common.md#meaningful-documentation The callback distinguishes inspection and refusal output and names the parent status owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reporting signature implements no DOM update or message-retention strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status delivery is an observable effect with no shared contact-result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent status sink owns retained text; the callback type acquires no handle.
   */
  report: (text: string) => void;
}
