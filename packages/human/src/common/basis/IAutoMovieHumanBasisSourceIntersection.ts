/**
 * One frozen original-edge preimage in a shared source cut table.
 * Its virtual sample is (1-t)*a+t*b over two distinct original source IDs.
 * The enclosing table's order assigns the virtual sample ID; both partitions
 * reuse the same ordered endpoints and t without reordering or renormalizing.
 *
 * @evidence contracts/common.md#principled-implementation Ordered original endpoints and one affine parameter preserve the cut sample's source lineage instead of coordinate coincidence.
 * @evidence contracts/common.md#clear-and-simple-design Three named fields replace the anonymous cut-table row shared by every partition consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The row stores identities and a dimensionless weight, never person coordinates or an exceptional vertex index.
 * @evidence contracts/common.md#meaningful-documentation States endpoint order, the affine formula, the t domain and who assigns the virtual ID.
 * @evidence contracts/modeling.md#shared-boundaries Both partitions evaluate the same ordered edge preimage, so the shared cut sample is not reconstructed from opposite-edge fractions.
 * @evidence contracts/modeling.md#spatial-conventions Endpoint IDs are dimensionless integers and t is a dimensionless affine parameter; no frame is stored.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A cut-table row defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled correspondence is not a person-authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The row names an existing source sample; the source compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The row displays nothing; the source compiler and consuming assembly observe geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source An affine edge parameter is no anatomical value or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range The open interval of t is a chart domain, not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled provenance is not an input through which a caller shapes a person.
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourceIntersection {
  /** Original source vertex ID at t=0, in [0, originalVertices). */
  readonly a: number;

  /** Distinct original source vertex ID at t=1, in [0, originalVertices). */
  readonly b: number;

  /** Dimensionless affine parameter along a to b, with 0 < t < 1. */
  readonly t: number;
}
