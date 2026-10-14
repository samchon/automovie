

/**
 * Check whether a typed identifier or explanation contains a non-whitespace character, preserving the original string and imposing no prose-quality policy.
 *
 * @evidence contracts/common.md#principled-implementation JavaScript trim followed by nonzero length implements the existing whitespace-only refusal for ids, paths and not-run reasons.
 * @evidence contracts/common.md#clear-and-simple-design The scalar predicate keeps whitespace absence separate from schema, path, ordering and semantic coverage checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No lexical score, minimum word count, content hash or replacement reason is produced; any non-whitespace typed string passes this limited check.
 * @evidence contracts/common.md#meaningful-documentation Documents typed string input, unchanged supplied text and the boolean meaning of containing a non-whitespace character.
 * @evidence contracts/performance.md#efficient-algorithms Trimming can scan and allocate with N string characters; there is no text quota and constant-time behavior is not asserted.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request/phase coordination or cache exists for this scalar absence check.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only invocation-local trim storage may be created; the function acquires no handle or task and retains no supplied string afterward.
 */
export const productionSemanticMaskNonBlank: (value: string) => boolean = (value: string): boolean => value.trim().length !== 0;
