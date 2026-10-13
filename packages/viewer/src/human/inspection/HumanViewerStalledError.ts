/**
 * Legacy capture-refusal identity retained by the existing refusal classifier.
 * It carries the caller's message and stable name only. Current capture stages
 * observe actual settlement and never create this error because time passed;
 * resource cancellation and renderer recovery remain with their lifetime owner.
 *
 *
 * @evidence contracts/common.md#principled-implementation A legacy Error subtype and explicit diagnostic name remain recognizable by classifyHumanViewerRefusal; current capture stages report actual settlement and do not manufacture this error from elapsed time.
 * @evidence contracts/common.md#clear-and-simple-design Keeps compatibility with the existing 503 refusal classifier without adding a timeout, forced cancellation or replacement policy to current capture ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Its label is not proof an underlying task stopped; pending work must remain under its actual lifetime owner, and no waiting threshold silently frees a GPU slot.
 * @evidence contracts/common.md#meaningful-documentation States legacy classification and the absence of a current elapsed-time producer; constructor message/name do not certify renderer recovery or completed resource release.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Error construction and one name assignment choose no capture or cancellation algorithm; queue/capture work remain their owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The classifier's retry advice is policy, not a reusable successful capture or a source-valid replacement realm.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Message and captured stack persist through references to this error with no length cap; the class holds no timer, renderer or cancellable task handle.
 *
 * @author Samchon
 */
export class HumanViewerStalledError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerStalledError";
  }
}
