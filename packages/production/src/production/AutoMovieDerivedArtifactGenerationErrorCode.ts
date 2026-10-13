

/**
 * The closed union distinguishes basis, callback, input, manifest, repeatability, output, path and publication refusal ownership.
 *
 * @evidence contracts/common.md#principled-implementation The closed union distinguishes basis, callback, input, manifest, repeatability, output, path and publication refusal ownership.
 * @evidence contracts/common.md#clear-and-simple-design Generation and retirement error constructors share these stable machine categories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The category describes a refusal; it does not certify that no output was already renamed before publication failure.
 * @evidence contracts/common.md#meaningful-documentation Documents the available failure domains and separately owned publication effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased category union performs no computation; AutoMovieDerivedArtifactGenerationError constructs the runtime refusal, while generation owns callback and publication work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Categories coordinate no retry or shared result; generation observes each attempt and creates its current refusal.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires nothing; catching callers retain the runtime Error, message, optional cause and stack.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactGenerationErrorCode = "basis-changed" | "generator-failed" | "input-missing" | "manifest-malformed" | "nondeterministic-output" | "output-malformed" | "path-unsafe" | "publication-failed";
