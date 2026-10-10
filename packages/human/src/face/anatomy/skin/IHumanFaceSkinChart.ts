import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * One source-registered material disk and its native continued inverse.
 * Registered vertices supply fixed dimensionless coordinates; reference-metre
 * offsets are registered on its shape-only reference skin. Compilation transports the same
 * native incidence through the current host. Performed geometry never selects
 * another nearest sheet, and the course is not a geodesic. Missing coverage or ambiguous continuation refuses.
 *
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
