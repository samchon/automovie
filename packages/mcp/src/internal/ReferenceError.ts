/**
 * A sanitized failure whose category and message are authored by reference policy.
 *
 * @evidence contracts/common.md#principled-implementation The standard Error subclass carries an intentional refusal category beside provider-authored recovery guidance.
 * @evidence contracts/common.md#clear-and-simple-design One class distinguishes policy refusals from unknown native exceptions in both transports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor never inspects or attaches a foreign error, path or source annotation.
 * @evidence contracts/common.md#meaningful-documentation The class and readonly code identify sanitized classification; the constructor accepts the operation's authored message.
 * @evidence contracts/performance.md#efficient-algorithms Construction retains one message and stack without scanning a document population.
 * @evidence contracts/performance.md#reuse-equivalent-work Each refusal owns its error and stack, so separate failed operations do not share mutable error state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The thrown instance transfers to its catcher and owns no source buffer, descriptor or running task.
 */
export class ReferenceError extends Error {

  /** Keep the intentional refusal category beside source-free recovery guidance. */
  public constructor(

    /** Stable refusal category used by reference providers and transports. */
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
