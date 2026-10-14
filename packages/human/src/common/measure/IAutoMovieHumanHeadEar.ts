/**
 * One ear as a head rule leaves it out of a search: the head view triangles
 * that touch the declared ear area, and the area's highest point at rest
 * (`humanHeadEar`).
 *
 *
 * @evidence contracts/common.md#principled-implementation The set contains every head-view triangle touching the named ear vertex area; top is that area's highest registered rest vertex in metres, as humanHeadEar determines.
 * @evidence contracts/common.md#clear-and-simple-design The result pairs the exclusion population with an independent height bound so consumers keep their separate measurement rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected anatomical ear size is stored; ordinal membership and height derive from the producing head view.
 * @evidence contracts/common.md#meaningful-documentation The comments state the touching-triangle convention, ordinal meaning, rest height and metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This ear-result interface constructs no set or triangle scan; humanHeadEar owns that algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ordinal set can be reused only with its producing head view; this shape defines no cross-head cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires nothing; its concrete caller-owned Set grows with selected head triangles and carries no handle or background task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadEar {
  /** Ordinals of the head view triangles with a vertex in the ear area. */
  triangles: Set<number>;

  /** Highest ear-area vertex height at rest, metres. */
  top: number;
}
