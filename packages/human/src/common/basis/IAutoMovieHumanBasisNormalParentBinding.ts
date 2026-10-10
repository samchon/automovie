/**
 * Raw normal binding of one used surface vertex to its source parent.
 * The vertex reads the parent's existing canonical ordered chart, so no cell
 * or coordinates are stored. A supplied normalParents entry keeps its raw
 * selector meaning and must agree with this parent.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalParentBinding {
  /** Raw parent ordinal in the enclosing partition's original triangle tree. */
  readonly parent: number;
}
