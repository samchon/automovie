import type { IAutoMovieHumanPersonSourceCell } from "./IAutoMovieHumanPersonSourceCell";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * What proving complete positive chart coverage of a source triangle tree reads: the oriented parent triangles, the cells partitioning them, and each cell sample's preimage over its parent's original corners. All read only.
 *
 * @evidence contracts/common.md#principled-implementation Oriented parent triangles, partition cells and parent-local positive preimages let coverage prove cancellation and complete affine boundary intervals without reading physical geometry.
 * @evidence contracts/common.md#clear-and-simple-design The preimage callback lets geometric and normal-cell trees share one coverage proof while retaining their own source namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage uses source identities and exact affine intervals rather than fitting an area tolerance to a known mesh.
 * @evidence contracts/common.md#meaningful-documentation Members state read-only ordered parent triples, child cells and parent-relative sample preimages.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The source-chart coverage cells and preimage callback are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the source-chart coverage cells and preimage callback; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring source-chart coverage cells and preimage callback acquires no handles or running tasks; the object owner controls ordinary data lifetime.
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
   *
   * @evidence contracts/common.md#principled-implementation Positive original-corner weights place each cell sample in its declared parent chart, allowing coverage to compare directed source intervals.
   * @evidence contracts/common.md#clear-and-simple-design A parent-relative reader lets the same coverage owner verify geometry cells and fixed normal cells with their respective source trees.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied preimage preserves source identity instead of reconstructing correspondence through a geometry-fitting tolerance.
   * @evidence contracts/common.md#meaningful-documentation The callback names cell sample and parent inputs and returns read-only coefficients over that parent's original corners.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coverage-preimage signature chooses no lookup structure; its caller supplies the admitted chart reader.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parent-relative preimage caching is a property of the supplied implementation, not this coverage callback declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The coverage reader borrows its coefficient arrays and starts no task or external resource lifetime.
   */
  preimage: (
    parent: number,
    sample: number,
  ) => readonly IAutoMovieHumanPersonSourceWeight[];
}
