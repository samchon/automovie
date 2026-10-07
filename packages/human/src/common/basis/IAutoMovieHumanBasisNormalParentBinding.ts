/**
 * Raw normal binding of one used surface vertex to its source parent.
 * The vertex reads the parent's existing canonical ordered chart, so no cell
 * or coordinates are stored. A supplied normalParents entry keeps its raw
 * selector meaning and must agree with this parent.
 *
 * @evidence contracts/common.md#principled-implementation A raw binding reuses the parent's existing source chart instead of restating a derived cell.
 * @evidence contracts/common.md#clear-and-simple-design One named variant distinguishes raw bindings from feature-cell bindings in the dense binding order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The binding stores a parent ordinal only, never person coordinates or an exceptional vertex index.
 * @evidence contracts/common.md#meaningful-documentation States which chart the vertex reads and its agreement with normalParents.
 * @evidence contracts/modeling.md#shared-boundaries Raw bindings preserve the existing ordered source chart across the shared cut.
 * @evidence contracts/modeling.md#spatial-conventions The parent is a dimensionless ordinal; no coordinate or frame is stored.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A binding defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled correspondence is not a person-authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The binding addresses an existing vertex; the source compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The binding displays nothing; its compiler and consuming assembly observe normals.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A parent ordinal is no anatomical value or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range An index domain is not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled incidence introduces no person-authoring vertex or normal input.
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalParentBinding {
  /** Raw parent ordinal in the enclosing partition's original triangle tree. */
  readonly parent: number;
}
