/**
 * One physical source point that render vertices of a mesh may alias.
 *
 * Equal domain/ID pairs identify one actual point duplicated for attributes such as UV or normal seams; coordinate contact alone never identifies two points. Reusing a pair across placed meshes asserts the same actual point in their shared frame.
 *
 * @evidence contracts/common.md#principled-implementation The ordered pair of domain and safe-integer id identifies an actual physical point independently of render attributes; the resolver encodes pair boundaries and verifies aliases share a topology-grid cell, so delimiter-like domains cannot collide.
 * @evidence contracts/common.md#clear-and-simple-design A domain establishes instance scope and an id identifies the point inside it; render-vertex references live in the correspondence table rather than making this source depend on mesh array order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinate contact is not evidence of shared identity, and a biological label or normal island cannot substitute for an actual physical-instance domain; large safe ids remain opaque identities rather than allocation sizes.
 * @evidence contracts/common.md#meaningful-documentation States the physical alias meaning, cross-mesh assertion, nonblank instance context and nonnegative safe-integer bounds, including which apparent groupings are not source identity.
 */
export interface IAutoMovieMeshPhysicalSource {
  /**
   * Nonblank equivalence context naming an actual physical instance; not a biological-source name or a normal island.
   */
  domain: string;

  /** Nonnegative safe-integer point identity within `domain`. */
  id: number;
}
