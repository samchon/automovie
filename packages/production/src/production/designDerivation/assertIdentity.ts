/**
 * Require a string identity containing a non-whitespace character.
 *
 * @evidence contracts/common.md#principled-implementation Checks runtime string type and trimmed nonemptiness without rewriting the supplied identity.
 * @evidence contracts/common.md#clear-and-simple-design One scalar rule serves production, target, selected export/selector and tool labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonblank text is not an identifier grammar, selected-export lookup or actual tool version proof.
 * @evidence contracts/common.md#meaningful-documentation Names the rejected identity role and preserves the original spelling on success.
 * @evidence contracts/performance.md#efficient-algorithms Type checking is fixed work and trimming scans/allocates according to identity text length.
 * @evidence contracts/performance.md#reuse-equivalent-work No prior identity result is reused across inputs; this owner has no state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no input or resource after return; a thrown Error keeps only formatted label/cause text and its runtime stack.
 */
export function assertIdentity(label: string, value: string): void {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`Design derivation ${label} is empty or malformed.`);
}
