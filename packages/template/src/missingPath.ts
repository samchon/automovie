/**
 * Whether an I/O failure denotes a missing path or a non-directory ancestor, the only cases scaffold directory creation may treat as absent.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Only ENOENT and ENOTDIR denote an absent level for the scaffold directory walk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One error-code predicate keeps missing-path admission identical in root, descendant and resident-file handling.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Permission, I/O and other failures remain failures instead of being treated as permission to create.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names both accepted codes and the limited directory-creation interpretation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two error-code comparisons take fixed work without traversing a path or its contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Separate errors are separate observations and this scalar predicate caches no result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The supplied error is read for the call and no handle or retained state is acquired.
 */
export const missingPath: (error: unknown) => boolean = (
  error: unknown,
): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT" ||
  (error as NodeJS.ErrnoException).code === "ENOTDIR";
