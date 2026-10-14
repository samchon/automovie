
/**
 * Say why builder-owned bytes on disk are not the bytes derived now.
 *
 * The message used to name "current source and design" as what derived the
 * expected digest, which reads as a verdict about the author's own inputs. A
 * digest mismatch is a statement about one output, and its cause is either an
 * edit to that builder-owned file or a move in any compile input, the build
 * protocol included. Naming the complete input set keeps an author from hunting
 * a source change that never happened, which is exactly what the old wording
 * cost while a compiled clearance report still carried the project revision and
 * every build rewrote it.
 *
 * `repair` separates the build that will rewrite the file from the read-only
 * lint that can only refuse it, because those two ask the author for different
 * things. An absent file has no digest, and rendering that absence rather than
 * inventing one keeps the two cases one message.
 *
 * @evidence contracts/common.md#principled-implementation Actual digest or null absence is compared in prose with the expected identity from the complete current input closure, and the repair flag distinguishes writable regeneration from read-only refusal without asserting a specific cause.
 * @evidence contracts/common.md#clear-and-simple-design Generated ownership inspection shares one explanation for missing and changed output; the inspector owns digest admission and the builder owns physical regeneration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The message does not invent an absent digest, blame source alone, or claim read-only lint will repair stored bytes.
 * @evidence contracts/common.md#meaningful-documentation States complete-input versus stored-output identity and writable/read-only correction effects.
 * @evidence contracts/performance.md#efficient-algorithms String construction costs O(A+E) space/time for rendered actual and expected identities plus fixed prose; no digest or filesystem operation is repeated here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each diagnostic reflects its caller's current observed/derived identities and no formatted answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string transfers to its diagnostic and remains until that result is released; this formatter retains no bytes, handles or tasks.
 * @author Samchon
 */
export function generatedOwnershipDiagnosticMessage(props: {
  /** Digest of the bytes on disk, or `null` when the file is absent. */
  actual: string | null;

  /** Digest the current compile inputs derive for that file. */
  expected: string;

  /** Whether the caller will rewrite the file rather than refuse it. */
  repair: boolean;
}): string {
  return `Generated digest is ${String(props.actual)} but the current design, source, authoring evidence, adopted content, and builder protocol derive ${props.expected}. Either this builder-owned file was edited or one of those inputs moved. ${
    props.repair
      ? "The builder will regenerate this builder-owned file."
      : "Run the scaffold compile command to regenerate it before accepting lint."
  }`;
}
