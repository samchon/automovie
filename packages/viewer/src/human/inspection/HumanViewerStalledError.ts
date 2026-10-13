/**
 * Legacy capture-refusal identity retained by the existing refusal classifier.
 * It carries the caller's message and stable name only. Current capture stages
 * observe actual settlement and never create this error because time passed;
 * resource cancellation and renderer recovery remain with their lifetime owner.
 *
 * @author Samchon
 */
export class HumanViewerStalledError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerStalledError";
  }
}
