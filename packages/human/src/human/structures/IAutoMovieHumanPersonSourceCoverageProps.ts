import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * What proving complete positive chart coverage of a source triangle tree
 * reads: the oriented parent triangles, the cells partitioning them, and each
 * cell sample's preimage over its parent's original corners. All read only.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCoverageProps {
  /** Flat oriented original-vertex triples, one per parent triangle. */
  parentTriangles: readonly number[];

  /** Cells partitioning those parents. */
  cells: readonly IAutoMovieHumanPersonSourceCell[];

  /**
   * Preimage of a cell sample over its parent's original corners.
   */
  preimage: (
    parent: number,
    sample: number,
  ) => readonly IAutoMovieHumanPersonSourceWeight[];
}
