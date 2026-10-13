/**
 * One physical source point that render vertices of a mesh may alias.
 *
 * Equal domain/ID pairs identify one actual point duplicated for attributes
 * such as UV or normal seams; coordinate contact alone never identifies two
 * points. Reusing a pair across placed meshes asserts the same actual point in
 * their shared frame.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshPhysicalSource {
  /**
   * Nonblank equivalence context naming an actual physical instance; not a
   * biological-source name or a normal island.
   */
  domain: string;

  /** Nonnegative safe-integer point identity within `domain`. */
  id: number;
}
