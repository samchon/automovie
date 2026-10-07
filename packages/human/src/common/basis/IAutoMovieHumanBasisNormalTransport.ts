import type { IAutoMovieHumanBasisNormalCellBinding } from "./IAutoMovieHumanBasisNormalCellBinding";
import type { IAutoMovieHumanBasisNormalParentBinding } from "./IAutoMovieHumanBasisNormalParentBinding";
import type { IAutoMovieHumanBasisNormalSubdivision } from "./IAutoMovieHumanBasisNormalSubdivision";

/**
 * Compiled source-cell incidence for transporting an ancestral smooth normal
 * field through genuine deformation. Geometry retains the enclosing source
 * partition's original IDs, oriented parents and ordered affine samples.
 *
 * Subdivisions define fixed source feature cells, not renderer tessellation.
 * Unlisted raw parents retain their original triangle as local cell zero.
 * Both halves share subdivisions; cells and bindings follow each half's own
 * emitted triangle and vertex order. Further clipping carries this source
 * field through its frozen chart instead of creating another normal star.
 *
 * The consumer receives same-state reference and current performed geometry.
 * It uses sqrt(current area/reference area) as the transverse scale of each
 * surface differential, applies its cofactor to the ancestral normal and
 * sums reference-area weighted densities over the full source incidence.
 * This is a numerical shading convention, not tissue thickness or a clinical
 * volume law. Zero displacement returns the reference field exactly.
 *
 * Ancestral reference domains belong to parentNormalDomains. These domains
 * distinguish deformation sides, without rebuilding the reference field.
 * A transport star retains physical sample, ancestral weighted-key identity
 * and deformation domain. Unchanged neighboring source cells participate too.
 * Generation labels cannot establish reference compatibility or source validity.
 * The source compiler and geometry owner retain coverage, fold and collision
 * checks; the assembly owns performed transport and rendered observation.
 *
 * @evidence contracts/common.md#principled-implementation Fixed source feature incidence transports the existing smooth field through an explicitly defined differential while preserving exact zero-displacement return and the original cut chart.
 * @evidence contracts/common.md#clear-and-simple-design Shared parent-local subdivisions and side-local cell/binding maps distinguish reference incidence from deformation incidence without a new geometry namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person coordinates or exceptional vertex IDs are encoded; source compatibility and geometry validity require actual consumer checks, and unregistered references are not replaced with neutral data.
 * @evidence contracts/common.md#meaningful-documentation Defines count/index/chart domains, source versus renderer incidence, reference/current order, shading convention and unpaid geometry/observation responsibilities.
 * @evidence contracts/modeling.md#shared-boundaries Raw bindings preserve the existing ordered source chart; feature bindings carry one source-defined normal field through later cuts without opposite-edge fraction reconstruction.
 * @evidence contracts/modeling.md#spatial-conventions Parent, cell, sample and domain IDs are dimensionless integers; coordinates are dimensionless affine parameters. Reference/current geometry shares the consuming assembly's metre frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This binding record defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines compiled correspondence, not a person-authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record binds an existing source field; the source compiler owns geometry emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record displays nothing; its source compiler and consuming assembly retain current geometry/normal observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The numerical shading convention establishes no anatomical measurement or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range Index and affine-chart domains are not physiological ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled shared-source incidence introduces no personal vertex or normal editing input.
 * @author Samchon
 */
export interface IAutoMovieHumanBasisNormalTransport {
  /** Shared unique ascending raw-parent subdivisions over canonical sample IDs. */
  readonly subdivisions: readonly IAutoMovieHumanBasisNormalSubdivision[];

  /** Local normal-cell ordinal per emitted triangle under its geometric parent. */
  readonly cells: readonly number[];

  /**
   * Dense surface vertex order. Null is allowed only for an actually unused
   * vertex. Raw bindings use the existing canonical ordered chart; feature
   * bindings name a source-defined local cell and its ordered [u,v] chart.
   * A supplied normalParents entry retains its raw selector meaning and must
   * agree with parent. Sparse, absent or unsupported used bindings refuse.
   */
  readonly bindings: readonly (
    | null
    | IAutoMovieHumanBasisNormalParentBinding
    | IAutoMovieHumanBasisNormalCellBinding
  )[];
}
