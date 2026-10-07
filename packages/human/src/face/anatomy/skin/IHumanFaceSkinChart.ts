import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * One source-registered material disk and its native continued inverse.
 * Registered vertices supply fixed dimensionless coordinates; reference-metre
 * offsets use the source facet differential. Compilation transports the same
 * native incidence through the current host. It is neither global nearest
 * projection nor a geodesic. Missing coverage or ambiguous continuation refuses.
 *
 * @evidence contracts/common.md#principled-implementation A locally nonsingular piecewise affine chart lifts an ordered path through its native triangle adjacency.
 * @evidence contracts/common.md#clear-and-simple-design Separates chart coordinate reading from one native-supported course compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-face preference, anatomical axis or artificial bridge defines a lift.
 * @evidence contracts/common.md#meaningful-documentation States chart authority, inverse-path meaning and unsupported conditions.
 * @evidence contracts/modeling.md#spatial-conventions Native material coordinates are dimensionless, while reference offsets and current host geometry retain head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Lifted intervals follow the host's actual shared topology.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Builds no new anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no public numerical trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft consumer owns geometry emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source chart is a geometric convention, not a follicle measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner admits its actual source support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source guides are not personal authoring inputs.
 * @author Samchon
 */
export interface IHumanFaceSkinChart {
  /** Read one registered native vertex's fixed material coordinates. */
  coordinate(vertex: number): IHumanFaceSkinChartCoordinate;

  /**
   * Convert a head-frame metre displacement using the source-reference facet
   * differential at this material point. The normal component is orthogonally
   * discarded. The affine local conversion is an authored guide convention,
   * not finite geodesic length; resulting domain coverage is checked by compile.
   */
  offset(
    point: IHumanFaceSkinChartCoordinate,
    displacement: readonly number[],
  ): IHumanFaceSkinChartCoordinate;

  /** Lift ordered chart chords to native pieces or report unsupported source. */
  compile(
    guide: readonly IHumanFaceSkinChartCoordinate[],
  ): IHumanFaceSkinChartSpan[];
}
