import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One answered station of a girth or breadth rule, as the measurement
 * instrument cut it.
 *
 * `readHumanBodyShapedMeasurement` hands an owned copy of each answered
 * station to its optional observer, so a consumer can read the same cut
 * without repeating the witness calculation. Mutating the copy changes
 * neither the measured skin nor a later station.
 *
 * @evidence contracts/common.md#principled-implementation A point, unit normal and seed reproduce an answered section's plane and component selection.
 * @evidence contracts/common.md#clear-and-simple-design The observer receives an owned section witness instead of recomputing the instrument placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copy ownership prevents an observer from changing the measured surface or later station.
 * @evidence contracts/common.md#meaningful-documentation Members state metres, normal orientation and nearest-loop selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measurement section witnesses declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measurement section witnesses schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The measurement section witnesses type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasurementSection {
  /**
   * Station on the rule's landmark segment, in metres; for a skin-level rule,
   * where the plane through the shaped witness vertex meets that segment.
   */
  point: IAutoMovieVector3;

  /** Unit plane normal: `+Y` for a horizontal rule, else the segment direction. */
  normal: IAutoMovieVector3;

  /** Position whose nearest closed loop by centroid is the measured component. */
  seed: IAutoMovieVector3;
}
