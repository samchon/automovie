/**
 * Return a borrowed required world matrix, or throw the supplied owner/role and node id on absence. The default owner is world driver; springs use their existing diagnostic owner.
 *
 * @evidence contracts/common.md#principled-implementation Read a required world matrix by id and refuse absence with owner/role-qualified text; producing composition/drivers own matrix validity.
 * @evidence contracts/common.md#clear-and-simple-design One reader serves analytic, iterative and spring passes while an optional owner preserves their failure vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent matrix becomes identity and owner context selects no numerical exception.
 * @evidence contracts/common.md#meaningful-documentation Docs give required identity, borrowed matrix and owner/role defaults rather than describing unrelated blend operations.
 * @evidence contracts/performance.md#efficient-algorithms An expected-constant-time lookup needs constant auxiliary space apart from failure text.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers read current world entries after each mutation, with no id-only stale matrix cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the borrowed matrix/error returns; no native transform, graph or task is retained.
 */
export const readWorld: (
  world: Map<string, number[]>,
  id: string,
  role: string,
  owner?: string,
) => number[] = (
  world: Map<string, number[]>,
  id: string,
  role: string,
  /** Diagnostic owner prefix; existing world drivers use the default. */
  owner: string = "world driver",
): number[] => {
  const matrix: number[] | undefined = world.get(id);
  if (matrix === undefined)
    throw new Error(`${owner} ${role} node "${id}" was not provided`);
  return matrix;
};
