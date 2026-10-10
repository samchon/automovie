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
 * @author Samchon
 */
export interface IHumanFaceSkinChartWalkInput {
  /** Native facet containing the chord's first point. */
  startTriangle: number;

  /** First coordinate in the fixed source chart. */
  from: IHumanFaceSkinChartCoordinate;

  /** Last coordinate, in the same source chart. */
  to: IHumanFaceSkinChartCoordinate;

  /** Read a lazily compiled current native chart cell. */
  cell(ordinal: number): IHumanFaceSkinChartTriangle;

  /** Read an exact native seat through the immutable shared host. */
  frame(seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame;

  /** Native course pieces accumulated by this ordered lift. */
  spans: IHumanFaceSkinChartSpan[];
}
