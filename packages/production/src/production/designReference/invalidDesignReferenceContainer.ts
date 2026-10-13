import { AutoMovieDesignReferenceContainerError } from "./AutoMovieDesignReferenceContainerError";

/**
 * Construct the shared typed refusal without losing the source path, observed family or exact parsing stage.
 *
 * @evidence contracts/common.md#principled-implementation Existing Error details contribute their message and other thrown values use standard String conversion; the structured refusal preserves logical path, recognized family and exact stage.
 * @evidence contracts/common.md#clear-and-simple-design Family parsers share this factory and the dedicated Error class owns the diagnostic identity and presentation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Details remain refusals rather than admitted metadata; the factory neither retries the container nor substitutes fixture-specific errors.
 * @evidence contracts/common.md#meaningful-documentation States typed refusal construction and preservation of source, family and stage.
 * @evidence contracts/performance.md#efficient-algorithms Detail normalization and message construction scale with rendered text; Error stack capture is runtime dependent and no container is rescanned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call describes a distinct parser failure and caches no successful or failed parse answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned error transfers to the parser caller with its strings and native stack; no file, process or task is acquired.
 */
export function invalidDesignReferenceContainer(path: string, family: string, stage: string, detail: unknown): AutoMovieDesignReferenceContainerError {
  return new AutoMovieDesignReferenceContainerError(
    path,
    family,
    stage,
    detail instanceof Error ? detail.message : String(detail),
  );
}
