
/**
 * Say why builder-owned bytes on disk are not the bytes derived now.
 *
 * The formatter renders the supplied actual or absent digest and the caller's derived digest, naming stored-byte edits and compile-input changes as possible causes. It does not independently determine which cause occurred or prove the supplied dependency closure complete.
 *
 * repair selects regeneration wording or the read-only compile remedy; publication success still belongs to the builder. Null is rendered explicitly for an absent file instead of inventing a digest.
 *
 * @evidence contracts/common.md#principled-implementation Supplied actual digest or null absence is rendered beside the caller's expected identity; repair selects writable or read-only remedy text without calculating a digest or establishing the physical cause.
 * @evidence contracts/common.md#clear-and-simple-design Generated ownership inspection shares one explanation for missing and changed output; the inspector owns digest admission and the builder owns physical regeneration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The message does not invent an absent digest, blame source alone, or claim read-only lint will repair stored bytes.
 * @evidence contracts/common.md#meaningful-documentation States supplied-identity ownership and writable/read-only wording; the literal message still mentions authoring evidence although the current project builder no longer acquires the retired internal Evidence graph.
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
