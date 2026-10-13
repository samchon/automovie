

/**
 * Read an actual string root from a native population, otherwise retain the native current-directory default.
 *
 * @evidence contracts/common.md#principled-implementation Read an actual string root from a native population, otherwise retain the native current-directory default.
 * @evidence contracts/common.md#clear-and-simple-design This helper exposes native default-root semantics to graph and manifest consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-string or absent root yields a dot selector; later admission owns valid path and physical boundary checks.
 * @evidence contracts/common.md#meaningful-documentation The result is a configuration-relative root and is not resolved to an absolute path here.
 * @evidence contracts/performance.md#efficient-algorithms One property lookup takes constant structural work independent of selector count.
 * @evidence contracts/performance.md#reuse-equivalent-work No root normalization or cache is introduced; callers resolve it against their own location.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied population remains caller-owned and no retained state is created.
 */
export function evidenceRoot(population: object): string {
  return "root" in population && typeof population.root === "string"
    ? population.root
    : ".";
}
