import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * One source-registered material disk and its native continued inverse.
 * Registered vertices supply fixed dimensionless coordinates; reference-metre
 * offsets are registered on its shape-only reference skin. Compilation transports the same
 * native incidence through the current host. Performed geometry never selects
 * another nearest sheet, and the course is not a geodesic. Missing coverage or ambiguous continuation refuses.
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

  /** Register one finite 3D point on the fixed shape-only native reference, with domain coverage required. */
  register(point: readonly number[]): IHumanFaceSkinChartCoordinate;

  /**
   * Register a finite head-frame metre displacement on the shape-only reference
   * skin through its native nearest owner, retaining that seat in this disk.
   * Performed skin cannot select another sheet. Source coverage and continuous
   * native lifting are required; the existing F64 nearest and geometric weight
   * bounds supply registration rather than an exact-nearest certificate.
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
