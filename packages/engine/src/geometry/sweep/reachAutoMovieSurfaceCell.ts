/**
 * The spacing a sample gives its cell below and above one axis, infinite where that side is not reached.
 *
 * @param step Signed spacing between adjacent samples
 * @param first Whether this is the first sample
 * @param last Whether this is the last sample
 * @returns Below and above spacing; negative steps reverse the end roles
 *
 * @evidence contracts/development/implementation.md#principled-implementation A boundary sample constrains only the side toward its neighboring sample, preserving the sampler's cell-reach rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared rule for patch grids and boundary edges.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero spacing reports no reach rather than inventing a cell width.
 * @evidence contracts/development/common.md#meaningful-documentation States signed spacing, boundary roles and the result ordering.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and a two-number result.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A numerical query with no cross-request coordination.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state or resources.
 */
export function reachAutoMovieSurfaceCell(
  step: number,
  first: boolean,
  last: boolean,
): [number, number] {
  const size: number = Math.abs(step);
  if (step === 0) return [Infinity, Infinity];
  const back: number = first ? Infinity : size;
  const ahead: number = last ? Infinity : size;
  return step > 0 ? [back, ahead] : [ahead, back];
}
