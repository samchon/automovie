/**
 * Fixed normal-cell subdivision of one raw source parent triangle.
 * The cells are source feature cells, not renderer tessellation: each is an
 * oriented triple of canonical original, cut or refinement sample IDs, and
 * each corner carries the deformation-side domain its normal star uses.
 * An unlisted raw parent retains its original triangle as local cell zero.
 *
 * @evidence contracts/common.md#principled-implementation Fixed source cells carry the ancestral smooth field through deformation instead of a renderer-derived tessellation.
 * @evidence contracts/common.md#clear-and-simple-design One named per-parent row replaces the anonymous subdivision entry shared by both partition halves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical sample IDs and domains are compiled data, never person coordinates or an exceptional vertex index.
 * @evidence contracts/common.md#meaningful-documentation States the parent table, triple orientation, sample domains, corner alignment and the unlisted-parent default.
 * @evidence contracts/modeling.md#shared-boundaries Both halves share one subdivision per raw parent, so the shared cut keeps one source-defined normal field.
 * @evidence contracts/modeling.md#spatial-conventions Parent, sample and domain IDs are dimensionless integers; no coordinate or frame is stored.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A subdivision row defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled incidence is not a person-authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The row partitions an existing source parent; the source compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The row displays nothing; its compiler and consuming assembly observe geometry and normals.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical shading incidence establishes no anatomical value or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range Index domains are not physiological ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled incidence introduces no person-authoring vertex or normal input.
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
