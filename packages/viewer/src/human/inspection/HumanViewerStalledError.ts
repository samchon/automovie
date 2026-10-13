/**
 * Legacy capture-refusal identity retained by the existing refusal classifier.
 * It carries the caller's message and stable name only. Current capture stages
 * observe actual settlement and never create this error because time passed;
 * resource cancellation and renderer recovery remain with their lifetime owner.
 *
 * @evidence contracts/common.md#principled-implementation Preserves an explicit named refusal for classification without establishing a clock-based capture or renderer policy.
 * @evidence contracts/common.md#clear-and-simple-design The Error subtype supplies only its message and name; it owns no timer, queue or browser state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constructor assignment changes only this error's name and never terminates work, restarts a viewer or alters a foreign Error instance.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes retained refusal identity from the current no-deadline stage observer and actual lifetime recovery.
 * @author Samchon
 */
export class HumanViewerStalledError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerStalledError";
  }
}
