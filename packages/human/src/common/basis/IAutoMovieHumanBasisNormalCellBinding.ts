/**
 * Feature normal binding of one used surface vertex to a source-defined cell.
 * The cell is a local ordinal under the raw parent's normal subdivision, and
 * coordinates [u,v] use that cell's ordered corners, not the parent's chart.
 * Later clipping carries this binding through its frozen chart instead of
 * creating another normal star.
 *
 * @evidence contracts/common.md#principled-implementation A feature binding carries one source-defined normal field through later cuts instead of opposite-edge fraction reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design One named variant distinguishes feature-cell bindings from raw parent bindings in the dense binding order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The binding stores ordinals and chart weights, never person coordinates or an exceptional vertex index.
 * @evidence contracts/common.md#meaningful-documentation States the parent table, the local cell domain and which corners the chart coordinates address.
 * @evidence contracts/modeling.md#shared-boundaries Feature bindings carry the shared source normal field across the cut through one frozen cell chart.
 * @evidence contracts/modeling.md#spatial-conventions Parent and cell are dimensionless ordinals and u, v are dimensionless affine coordinates; no frame is stored.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A binding defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled correspondence is not a person-authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The binding addresses an existing vertex; the source compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The binding displays nothing; its compiler and consuming assembly observe normals.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Cell ordinals and chart coordinates are no anatomical value or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range The cell chart domain is not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled incidence introduces no person-authoring vertex or normal input.
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalCellBinding {
  /** Raw parent ordinal in the enclosing partition's original triangle tree. */
  readonly parent: number;

  /** Local normal-cell ordinal under that parent's subdivision. */
  readonly cell: number;

  /** Dimensionless [u,v] chart coordinates over the cell's ordered corners. */
  readonly coordinates: readonly [number, number];
}
