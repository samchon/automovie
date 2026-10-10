import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinChartMetricSpan } from "./IHumanFaceSkinChartMetricSpan";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * One continuous native chart lift read by physical arc distance.
 * Its Euclidean distance reader and native frame lookup consume the same
 * metric intervals. Neither is a geodesic or another nearest projection.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartCourse extends IHumanFaceProjectedSkinCourse {
  /** Positive native intervals with their accumulated physical stations. */
  spans: readonly IHumanFaceSkinChartMetricSpan[];

  /**
   * Read a distance in [0,totalLengthMetres] on this same native course.
   * The retained frame callback reads its original immutable chart host.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
