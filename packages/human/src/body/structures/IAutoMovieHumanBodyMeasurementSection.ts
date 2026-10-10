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
