import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";

/**
 * A lifted chart interval lying on one actual native skin triangle.
 * Endpoints are head-frame metres. The frame reader follows that same
 * triangle's barycentric interval, without another nearest-point query.
 *
 * @evidence contracts/common.md#principled-implementation A span retains one actual native triangle and its lifted endpoints; walkHumanFaceSkinChart captures exact endpoint barycentrics so intermediate frames stay on that facet.
 * @evidence contracts/common.md#clear-and-simple-design Endpoints supply metric length while frameAt supplies the same native support, separating physical measurement from immutable chart continuation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame callback interpolates native correspondence instead of issuing another nearest-point query or inventing a connecting face.
 * @evidence contracts/common.md#meaningful-documentation The comment gives head-frame metres, triangle ownership and closed interval frame semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This span interface defines data and a callback signature; the walker and metric compiler own processing cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no computation; its callback must retain the original immutable chart host.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no resource; the returned course owns spans and their retained frame closures.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartSpan {
  /** Actual native triangle ordinal in the host's complete winding. */
  triangle: number;

  /** First point of the native-supported interval, in metres. */
  start: readonly number[];

  /** Last point of that same native-supported interval, in metres. */
  end: readonly number[];

  /**
   * Read an actual closed interval fraction in [0,1] on this native piece.
   *
   * @evidence contracts/common.md#principled-implementation The walker's callback blends its exact endpoint barycentrics and invokes the same facet frame owner; finite fractions outside [0,1] refuse.
   * @evidence contracts/common.md#clear-and-simple-design The fraction addresses only this span, while course-distance selection belongs to createHumanFaceSkinChartCourse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest reseating or width-based sampling changes the retained native interval.
   * @evidence contracts/common.md#meaningful-documentation The signature documents closed unit-fraction input and the native interval read by the result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature implements no traversal; its captured walker frame evaluates three barycentric corners.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no cache; captured endpoints and host state remain owned by its producer.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no resource; its function value lives with the consuming span.
   */
  frameAt(fraction: number): IHumanFaceSkinFrame;
}
