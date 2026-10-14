

/**
 * Failure stages from strict byte ingress and interleaved JSON grammar/member-name admission.
 *
 * @evidence contracts/common.md#principled-implementation The closed stage union separates strict encoding, JSON grammar and decoded duplicate-member admission.
 * @evidence contracts/common.md#clear-and-simple-design Full UTF-8 admission precedes parsing; grammar and decoded duplicate-member checks then interleave at the current cursor, before application schema validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These stages do not include application schema or live filesystem admission.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes encoding-first admission from interleaved syntax/duplicate refusal; the union labels no application schema or filesystem failure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased stage union parses no bytes; parseAutoMovieStructuredJson and AutoMovieStructuredJsonParser own encoding, grammar and duplicate checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stage labels share no parser work; validation and materialization happen in the current ingress call rather than a retained record cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union retains nothing; parser frames/input text expire after admission and callers retain returned trees or Error metadata.
 * @author Samchon
 */
export type AutoMovieStructuredJsonStage = "encoding" | "syntax" | "duplicate";
