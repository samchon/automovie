import fs from "node:fs";
import path from "node:path";

/**
 * Resolves and validates a required comparison directory.
 *
 * @evidence contracts/common.md#principled-implementation Resolve the input path and require an existing directory through Node filesystem checks.
 * @evidence contracts/common.md#clear-and-simple-design Boundary validation returns an absolute lexical comparison root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filesystem failures propagate; missing or non-directory roots receive explicit errors.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies required directories; errors identify the property and resolved path.
 * @evidence contracts/performance.md#efficient-algorithms Resolution scales with path length and performs existence and stat checks without tree traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Checks repeat because filesystem state may change between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous filesystem calls leave no owned open handle.
 */
export function directory(root: string, property: string): string {
  const resolved: string = path.resolve(root);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())
    throw new Error(
      `${property}: expected an existing directory at ${resolved}.`,
    );
  return resolved;
}
