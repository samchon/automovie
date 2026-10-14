/**
 * Fixed normal-cell subdivision of one raw source parent triangle.
 * The cells are source feature cells, not renderer tessellation: each is an
 * oriented triple of canonical original, cut or refinement sample IDs, and
 * each corner carries the deformation-side domain its normal star uses.
 * An unlisted raw parent retains its original triangle as local cell zero.
 *
 * @evidence contracts/common.md#principled-implementation Oriented canonical sample triples and corner deformation domains partition one raw parent's fixed normal feature cells.
 * @evidence contracts/common.md#clear-and-simple-design The source-defined cells remain independent of renderer tessellation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unlisted parents retain original cell zero instead of acquiring a generated reference normal field.
 * @evidence contracts/common.md#meaningful-documentation Members state parent ordinal, oriented sample triples and nonnegative corner domains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The source normal cell subdivision has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source normal cell subdivision schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source normal cell subdivision declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalSubdivision {
  /** Ordinal in the enclosing partition's original parent triangle tree. */
  readonly parent: number;

  /** Flat oriented canonical original/cut/refinement sample triples. */
  readonly triangles: readonly number[];

  /** One nonnegative deformation-side domain per normal-cell corner. */
  readonly domains: readonly number[];
}
