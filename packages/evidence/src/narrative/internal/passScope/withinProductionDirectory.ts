/**
 * Keeps both captured physical ownership and root-normalized logical ownership.
 *
 * @evidence contracts/common.md#principled-implementation Containment is checked in both physical and root-normalized logical spaces supplied by the capture; exact equality or a slash-delimited descendant prefix prevents sibling-prefix matches.
 * @evidence contracts/common.md#clear-and-simple-design One predicate centralizes dual-space directory semantics for all authored layer and pass checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The slash separator is the canonical path representation, not an exception for a consumer; no raw startsWith without a directory boundary is accepted.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the two ownership spaces, and the canonical callback makes their capture owner explicit.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed comparisons each normalize filename and directory; work and transient strings are O(p) in path length, independent of directory contents.
 * @evidence contracts/performance.md#reuse-equivalent-work Every comparison uses the same caller canonicalizer and its capture identity; this helper maintains no independent cache or live path resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the two-space iteration and normalized strings are call-local; no filesystem handle, task or growing retained collection is created.
 */
export function withinProductionDirectory(
  root: string,
  filename: string,
  directory: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): boolean {
  return [undefined, root].some((logicalRoot: string | undefined): boolean => {
    const target: string = canonical(filename, logicalRoot);
    const base: string = canonical(directory, logicalRoot);
    return (
      target === base ||
      target.startsWith(base.endsWith("/") ? base : `${base}/`)
    );
  });
}
