import * as path from "node:path";

/**
 * Whether a resolved target is the root or a lexical descendant under the current platform's path rules.
 *
 * @evidence contracts/common.md#principled-implementation Path.relative determines whether a target is the root or a descendant, rejecting parent traversal and absolute remainders.
 * @evidence contracts/common.md#clear-and-simple-design The shared lexical containment predicate serves both descendant capture and physical real-path ownership checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It compares path components rather than accepting a string prefix that could name a sibling directory.
 * @evidence contracts/common.md#meaningful-documentation The comment names the root-inclusive result and dependence on the current platform's path rules.
 * @evidence contracts/performance.md#efficient-algorithms One relative-path calculation and prefix checks cost time proportional to the two path lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work The pure path predicate has no request coordination or filesystem cache; callers supply the actual lexical or real paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary relative string lives only for the call and no filesystem handle is opened.
 */
export const inside: (root: string, target: string) => boolean = (
  root: string,
  target: string,
): boolean => {
  const relative: string = path.relative(root, target);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      relative.startsWith(`..${path.sep}`) === false &&
      path.isAbsolute(relative) === false)
  );
};
