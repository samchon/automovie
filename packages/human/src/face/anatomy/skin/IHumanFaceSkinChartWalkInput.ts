import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * One ordered source-chart chord and its actual native starting facet.
 * Native cells and exact frame transport stay with the immutable chart;
 * this walker owns only topological continuation and interval partitioning.
 *
 * @evidence contracts/common.md#principled-implementation Exact material endpoints and a native starting facet determine chord continuation; cell adjacency and the immutable frame reader supply actual topology and physical lift.
 * @evidence contracts/common.md#clear-and-simple-design The walker borrows chart accessors and appends spans rather than recompiling a chart or copying physical skin geometry into its input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Starting incidence and ordered endpoints come from the registered chart; no relief-width tolerance or arbitrary nearest sheet selects continuation.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish fixed chart coordinates, native facet access, exact frame transport and the mutable accumulated span output.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This walker input declares no algorithm; walkHumanFaceSkinChart owns finite-cell continuation and rational arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input type schedules no work; the chart and walker own immutable cells and per-chord equations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; spans are caller-owned and callbacks retain their chart state through ordinary references.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartWalkInput {
  /** Native facet containing the chord's first point. */
  startTriangle: number;

  /** First coordinate in the fixed source chart. */
  from: IHumanFaceSkinChartCoordinate;

  /** Last coordinate, in the same source chart. */
  to: IHumanFaceSkinChartCoordinate;

  /**
   * Read a compiled native chart cell; an ordinal outside the registered disk refuses.
   *
   * @evidence contracts/common.md#principled-implementation createHumanFaceSkinChart resolves the native ordinal from its admitted positive-facet map, preserving the caller's registered winding.
   * @evidence contracts/common.md#clear-and-simple-design The callback exposes one chart cell without exposing or rebuilding the complete cell map.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing native incidence throws rather than selecting a substitute triangle.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes compiled native-cell access and refusal outside the registered disk.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature implements no lookup; the chart producer owns map construction and access.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no requests; repeated reads reach the chart's immutable cell map.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Cell-map retention belongs to the chart closure, not this signature.
   */
  cell(ordinal: number): IHumanFaceSkinChartTriangle;

  /**
   * Read an exact native seat through the immutable shared host.
   *
   * @evidence contracts/common.md#principled-implementation The chart passes host.frameExact so lifted barycentrics use the same native physical corners and round the affine point once.
   * @evidence contracts/common.md#clear-and-simple-design Frame transport stays with the host; the walker supplies only triangle identity and weights.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback does not choose another nearest point or another skin state.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies exact native seats and the immutable shared physical host.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no interpolation; createHumanFaceSkinHost owns its fixed three-corner arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature schedules no work; it borrows the chart's original host reader.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The frame function's captured geometry remains with the host owner.
   */
  frame(seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame;

  /** Native course pieces accumulated by this ordered lift. */
  spans: IHumanFaceSkinChartSpan[];
}
