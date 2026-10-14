/**
 * Normalize the first XYZ components of a preview light or card direction.
 * The caller supplies three finite components with a finite nonzero norm;
 * current studio directions and the grey-card normal satisfy that premise.
 * A zero or nonnumeric norm refuses. Overflowed norms are outside this helper's
 * supported studio input range and are not silently certified as unit vectors.
 *
 * @evidence contracts/common.md#principled-implementation Euclidean normalization divides XYZ by Math.hypot, preserving direction for finite nonzero representable norms; humanPreviewGreyCard supplies finite authored studio tuples. Nonpositive/NaN norms refuse, while overflowed norms are an unsupported limitation rather than validated unit output.
 * @evidence contracts/common.md#clear-and-simple-design A small shared scalar helper normalizes the card normal and directional-light vectors using the same convention before Lambertian cosine evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No particular light, normal or expected irradiance is special-cased; invalid zero-length directions are not replaced with a preferred studio axis.
 * @evidence contracts/common.md#meaningful-documentation Documents XYZ selection, finite nonzero norm premises, current studio caller grounds and the overflow limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One three-component norm and three divisions are fixed scalar work with no alternative traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied direction is normalized independently; this helper coordinates no cross-frame request or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned XYZ tuple and retains no caller vector, light or renderer state.
 */
export const humanPreviewUnitVector: (v: readonly number[]) => [number, number, number] = (v: readonly number[]): [number, number, number] => {
  const length: number = Math.hypot(v[0]!, v[1]!, v[2]!);
  if (!(length > 0)) throw new Error("A light direction needs a length.");
  return [v[0]! / length, v[1]! / length, v[2]! / length];
};
