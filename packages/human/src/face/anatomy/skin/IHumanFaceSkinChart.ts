import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";

/**
 * One source-registered material disk and its native continued inverse. Registered vertices supply fixed dimensionless coordinates; reference-metre offsets are registered on its shape-only reference skin. Compilation transports the same native incidence through the current host. Performed geometry never selects another nearest sheet, and the course is not a geodesic. Missing coverage or ambiguous continuation refuses.
 *
 * @evidence contracts/common.md#principled-implementation Material coordinates registered on reference skin compile through fixed native incidence on the current host.
 * @evidence contracts/common.md#clear-and-simple-design Reference coordinate/register/offset operations stay separate from current physical course compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous or missing support refuses; reference Float64 nearest selection is not an exact nearest-point proof and posed nearest reselection is not used.
 * @evidence contracts/common.md#meaningful-documentation Chart coordinates are dimensionless material values and output frames use head metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference projection, exact native walking and frame work execute in chart owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registered material identity and chart inverses are reused across courses on one immutable current host.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The chart retains copied registration/reference data and borrowed immutable current host callbacks for its lifetime.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChart {
  /**
   * Read one registered native vertex's fixed material coordinates.
   *
   * @evidence contracts/common.md#principled-implementation Registered native vertex identity looks up exact represented material coordinates in one disk.
   * @evidence contracts/common.md#clear-and-simple-design Fixed material correspondence remains separate from current physical host positions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing coverage refuses and material coordinates are not texture UVs or acquired anatomical lengths.
   * @evidence contracts/common.md#meaningful-documentation The returned dimensionless fractions preserve represented source corners exactly.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Ordinal lookup and rational conversion execute in createHumanFaceSkinChart.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The compiled vertex map/registration is reused across coordinate and chord reads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The chart owns registration/map lifetime and returns owned exact coordinate records.
   */
  coordinate(vertex: number): IHumanFaceSkinChartCoordinate;

  /**
   * Register one finite 3D point on the fixed shape-only native reference, with domain coverage required.
   *
   * @evidence contracts/common.md#principled-implementation One finite reference-metre point is seated on the shape-only native host and lowered into the same material disk.
   * @evidence contracts/common.md#clear-and-simple-design Current performed geometry does not reselect a nearest sheet.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside-disk coverage refuses; exact material arithmetic preserves F64 represented seating rather than an exact-nearest certificate.
   * @evidence contracts/common.md#meaningful-documentation Input head metres become dimensionless registered fractions without changing the authored reference point.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Lazy native query and affine/rational coordinate work execute in createHumanFaceSkinChart.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One copied reference host/query is initialized on first registration and reused by later offsets.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The chart retains reference buffers and optional compiled host; returned material coordinates belong to callers.
   */
  register(point: readonly number[]): IHumanFaceSkinChartCoordinate;

  /**
   * Register a finite head-frame metre displacement on the shape-only reference skin through its native nearest owner, retaining that seat in this disk. Performed skin cannot select another sheet. Source coverage and continuous native lifting are required; the existing F64 nearest and geometric weight bounds supply registration rather than an exact-nearest certificate.
   *
   * @evidence contracts/common.md#principled-implementation A displacement advances the current material point on the shape-only reference and reuses native registration in the same disk.
   * @evidence contracts/common.md#clear-and-simple-design Reference metric changes stay separate from performed-sheet selection and chord continuation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing coverage or ambiguous continuation refuses; zero displacement preserves coordinates and no personal sculpting path is invented.
   * @evidence contracts/common.md#meaningful-documentation Displacement uses head metres while the returned coordinate remains dimensionless exact material data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Native frame, lazy reference seating and rational lowering execute in the chart owner.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same reference host and fixed material disk are reused with existing coordinate/inverse owners.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The chart owns reference-host lifetime while only an owned small coordinate escapes offset reading.
   */
  offset(
    point: IHumanFaceSkinChartCoordinate,
    displacement: readonly number[],
  ): IHumanFaceSkinChartCoordinate;

  /**
   * Lift ordered chart chords to native pieces or report unsupported source.
   *
   * @evidence contracts/common.md#principled-implementation Ordered material chords continue through exact registered cells into native affine spans and frame callbacks.
   * @evidence contracts/common.md#clear-and-simple-design The chart owns source correspondence while the walker owns successive cell/event continuation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing coverage/ambiguous native continuation refuses instead of an unsupported chord or new nearest performed sheet.
   * @evidence contracts/common.md#meaningful-documentation Guide coordinates are dimensionless and emitted physical endpoints use the retained current head-metre host.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Native cell walking and rational bit work execute in walkHumanFaceSkinChart.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each next chord starts from the previous resolved triangle and reuses compiled inverses/adjacency.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned span array is owned and its callbacks retain the chart's original host until course release.
   */
  compile(
    guide: readonly IHumanFaceSkinChartCoordinate[],
  ): IHumanFaceSkinChartSpan[];
}
