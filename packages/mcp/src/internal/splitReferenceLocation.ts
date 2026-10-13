import { fail } from "./fail";
import { admitReferencePath } from "./admitReferencePath";


/**
 * Split one exact section address without guessing an anchor or normalizing a path.
 *
 *
 * @evidence contracts/common.md#principled-implementation Exactly one nonedge hash separator divides a section address, and its file portion passes the same exact path admission used by whole-file reads.
 * @evidence contracts/common.md#clear-and-simple-design Location grammar and file grammar remain separate; the result carries the authored anchor unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anchor slug, nearest-section fallback or path normalization is invented.
 * @evidence contracts/common.md#meaningful-documentation Returned members identify admitted file and exact nonempty anchor; INVALID_LOCATION reports separator defects before read access.
 * @evidence contracts/performance.md#efficient-algorithms Scanning and slicing L characters is O(L) time and returned string storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The same path predicate serves both addressing forms; each location is inspected without memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two caller-owned result strings escape; no source snapshot or external resource is retained.
 */
export function splitReferenceLocation(location: string): {

  /** Admitted canonical authored Markdown path before the single anchor separator. */
  file: string;

  /** Exact nonempty authored anchor after the separator, without slug inference. */
  anchor: string;
} {
  const index: number = location.indexOf("#");
  if (
    index < 1 ||
    index === location.length - 1 ||
    location.indexOf("#", index + 1) !== -1
  )
    return fail(
      "INVALID_LOCATION",
      "Use the exact file#anchor returned by the file index.",
    );
  const file: string = location.slice(0, index);
  admitReferencePath(file);
  return { file, anchor: location.slice(index + 1) };
}
