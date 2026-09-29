import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One specifically named ligament, fascial tract or aponeurotic sheet.
 *
 * MRI/CT volume or a fictional target is a material quantity, not a tendon
 * path, collagen direction, stiffness or skin displacement. The owning part
 * supplies the anatomical identity and named bone/muscle attachments.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyFibrousTissueMeasurements {
  /** Volume of this one named fibrous tissue, excluding adjacent muscle. */
  readonly tissueVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
