/**
 * Fixed normal-cell subdivision of one raw source parent triangle.
 * The cells are source feature cells, not renderer tessellation: each is an
 * oriented triple of canonical original, cut or refinement sample IDs, and
 * each corner carries the deformation-side domain its normal star uses.
 * An unlisted raw parent retains its original triangle as local cell zero.
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
