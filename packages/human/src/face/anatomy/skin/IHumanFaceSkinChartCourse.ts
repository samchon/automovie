import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinChartMetricSpan } from "./IHumanFaceSkinChartMetricSpan";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * One continuous native chart lift read by physical arc distance.
 * Its Euclidean distance reader and native frame lookup consume the same
 * metric intervals. Neither is a geodesic or another nearest projection.
 *
 * @evidence contracts/common.md#principled-implementation One actual native interval population defines arc station, Euclidean distance and frame support.
 * @evidence contracts/common.md#clear-and-simple-design Extends the shared course reading with retained native frame lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No re-seating or alternate metric supplies attachment frames.
 * @evidence contracts/common.md#meaningful-documentation States physical metric and native support ownership.
 * @evidence contracts/modeling.md#spatial-conventions Distance and positions are head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Every frame retains the lifted native triangle.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Adds no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The consumer emits geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consumer observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This metric is geometric, not a clinical trajectory.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and contact owners admit construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal curve input.
 * @author Samchon
 */
export interface IHumanFaceSkinChartCourse extends IHumanFaceProjectedSkinCourse {
  /** Positive native intervals with their accumulated physical stations. */
  spans: readonly IHumanFaceSkinChartMetricSpan[];

  /**
   * Read a distance in [0,totalLengthMetres] on this same native course.
   * The retained frame callback reads its original immutable chart host.
   *
   * @evidence contracts/common.md#principled-implementation Accumulated physical arc selects one native interval whose affine fraction retains its original barycentric support.
   * @evidence contracts/common.md#clear-and-simple-design Extends the same course used by Euclidean distance without another geometry reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No free-guide station or nearest reseating replaces native correspondence.
   * @evidence contracts/common.md#meaningful-documentation States closed distance domain and immutable frame ownership.
   * @evidence contracts/modeling.md#spatial-conventions Input and returned point remain head-frame metres.
   * @evidence contracts/modeling.md#shared-boundaries Reads the same native interval that supplies metric endpoints.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Adds no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no trait.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation The attached and relief consumers observe their output.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry lookup rather than clinical measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range Source and contact owners retain admission.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal curve input.
   */
  frameAt(distanceMetres: number): IHumanFaceSkinFrame;
}
