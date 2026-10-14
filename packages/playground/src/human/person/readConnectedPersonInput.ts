import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Read a numeric scalar, choice string or explicit null operation at literal catalogue path segments, or undefined for omission/composite values. Dots inside an identifier remain part of that segment. This lookup does not validate a choice, numerical range or admission.
 *
 * @evidence contracts/common.md#principled-implementation Own-property traversal distinguishes omitted paths from explicit null and does not split authored identifiers or read inherited members.
 * @evidence contracts/common.md#clear-and-simple-design One iterative lookup supplies scalar controls while leaving descriptor-specific units/ranges to catalogue metadata and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Composite records and missing paths are not converted into guessed scalar defaults or fabricated readings.
 * @evidence contracts/common.md#meaningful-documentation The comment defines literal segments, omission/null and the absence of validation.
 * @evidence contracts/performance.md#efficient-algorithms Traversal is O(d) own-property checks for d segments with constant auxiliary storage; it stops as soon as an intermediate record is missing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lookup reads the supplied document directly and retains no path/value cache that could become stale after edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function borrows its document only during the call and returns a scalar, with no retained document, handle or running task.
 *
 * @author Samchon
 */
export function readConnectedPersonInput(
  document: IAutoMovieHumanPersonDocument,
  path: readonly string[],
): number | string | null | undefined {
  let node: unknown = document;
  for (const key of path) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, key))
      return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" || typeof node === "string" || node === null
    ? node
    : undefined;
}
