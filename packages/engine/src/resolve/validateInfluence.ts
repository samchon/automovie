/** Require a finite solver influence within the closed unit interval.
 *
 * @evidence contracts/common.md#principled-implementation Require a finite influence in the closed unit interval, reporting label-qualified failures for nonfinite, negative or above-one scalars.
 * @evidence contracts/common.md#clear-and-simple-design One shared guard keeps world-solver blend admission consistent without another interpolation policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed influence throws rather than clamps/defaults, while zero/one remain exact supported endpoints.
 * @evidence contracts/common.md#meaningful-documentation Docs state finiteness, closed range and diagnostic ownership before solver use.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed scalar checks require constant work with no collection allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work All world solvers reuse the same range law and no scalar-result cache is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only success/error returns; no map, native handle or running task is retained.
 */
export const validateInfluence: (label: string, influence: number) => void = (
  label: string,
  influence: number,
): void => {
  if (!Number.isFinite(influence))
    throw new Error(
      `world driver ${label} influence must be finite, but was ${influence}`,
    );
  if (influence < 0)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
  if (influence > 1)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
};
