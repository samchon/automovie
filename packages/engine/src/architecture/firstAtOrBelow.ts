/**
 * The first index of a top-height-descending list at or below one height.
 *
 * A binary search rather than a scan, because the bodies above a subject are the
 * many in a tall building and reading past them is the cost this ordering exists
 * to avoid.
  * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
 * @author Samchon
 */
export const firstAtOrBelow = (
  descending: readonly { bounds: IWorldBox }[],
  ceiling: number,
): number => {
  let low = 0;
  let high = descending.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (descending[middle]!.bounds.max.y > ceiling) low = middle + 1;
    else high = middle;
  }
  return low;
};
