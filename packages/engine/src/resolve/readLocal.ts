import { IAutoMovieTransform } from "@automovie/interface";

/**
 * Return a borrowed required local transform from the supplied map, or throw its diagnostic role and node id on absence. The default role preserves world-driver descendant errors; springs supply their own role.
 *
 * @evidence contracts/common.md#principled-implementation Read a required local transform by id, return its borrowed record and throw role-qualified text on absence; numerical admission belongs to the producer.
 * @evidence contracts/common.md#clear-and-simple-design One reader serves descendant recomposition and springs, with diagnostic role preserving their existing errors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing local data is never replaced by identity and the role changes diagnostics rather than arithmetic.
 * @evidence contracts/common.md#meaningful-documentation Docs state required id, borrowed return and default role, not whole-transform validity.
 * @evidence contracts/performance.md#efficient-algorithms One expected-constant-time map lookup uses O(1) auxiliary space apart from error text.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers share the reader and always observe current map entries rather than caching stale transforms.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns map/record and the reader retains no graph, handle or task.
 */
export const readLocal: (
  localById: Map<string, IAutoMovieTransform>,
  id: string,
  role?: string,
) => IAutoMovieTransform = (
  localById: Map<string, IAutoMovieTransform>,
  id: string,
  /** Diagnostic role that owns this required lookup. */
  role: string = "world driver descendant local transform",
): IAutoMovieTransform => {
  const local: IAutoMovieTransform | undefined = localById.get(id);
  if (local === undefined)
    throw new Error(`${role} node "${id}" was not provided`);
  return local;
};
