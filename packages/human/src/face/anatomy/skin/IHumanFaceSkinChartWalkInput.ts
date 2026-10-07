import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";
import type { IHumanFaceSkinChartSpan } from "./IHumanFaceSkinChartSpan";
import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * One ordered source-chart chord and its actual native starting facet.
 * Native cells and exact frame transport stay with the immutable chart;
 * this walker owns only topological continuation and interval partitioning.
 *
 * @evidence contracts/common.md#principled-implementation A start facet and affine chord define a lift through actual adjacent native cells.
 * @evidence contracts/common.md#clear-and-simple-design Passes native cell and frame readers without another mesh authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies no nearest-face preference or iteration budget.
 * @evidence contracts/common.md#meaningful-documentation Names start support, chord order and retained result ownership.
 * @evidence contracts/modeling.md#spatial-conventions Chart coordinates are dimensionless and frame points are head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Cell adjacency and native barycentric frame transport share the chart owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Adds no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits only internal course intervals.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer observes its geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains no clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner admits its supported source domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal vertex or curve input.
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
