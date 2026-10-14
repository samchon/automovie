import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinChartMetricSpan } from "./IHumanFaceSkinChartMetricSpan";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * One continuous native chart lift read by physical arc distance. Its Euclidean distance reader and native frame lookup consume the same metric intervals. Neither is a geodesic or another nearest projection.
 *
 * @evidence contracts/common.md#principled-implementation Native chart intervals expose physical length, attachment proximity and exact seat frames.
 * @evidence contracts/common.md#clear-and-simple-design One compiled course shares native spans and physical metric endpoints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constant courses cannot supply advancing interval frames and current host callback state must remain immutable.
 * @evidence contracts/common.md#meaningful-documentation Station follows physical arc length, while frameAt fractions locate native material intervals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native walking, physical norms and nearest-span reads execute in course/host implementations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compilation and copied interval endpoints serve repeated attachment/frame queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The course owns span arrays but closures retain chart/host callbacks until release rather than cloning their geometry state.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartCourse extends IHumanFaceProjectedSkinCourse {
  /** Positive native intervals with their accumulated physical stations. */
  spans: readonly IHumanFaceSkinChartMetricSpan[];

  /**
   * Read a distance in [0,totalLengthMetres] on this same native course. The retained frame callback reads its original immutable chart host.
   *
   * @evidence contracts/common.md#principled-implementation Physical arc distance selects a positive compiled interval and reads its original native barycentric frame.
   * @evidence contracts/common.md#clear-and-simple-design Distance-to-span and frame lookup consume the same copied endpoints and cumulative station population.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range/nonfinite or entirely constant courses refuse; no nearest reseating or geodesic claim replaces the original interval.
   * @evidence contracts/common.md#meaningful-documentation Distance is head metres in the closed course interval and returned frame belongs to the retained native host.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The current metric-course implementation linearly scans spans before invoking the selected frame callback.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Endpoints and accumulated lengths are compiled once and reused across physical-distance reads.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The course retains copied metrics plus chart-owned callbacks until release; frame result lifetime remains with its actual host reader.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
