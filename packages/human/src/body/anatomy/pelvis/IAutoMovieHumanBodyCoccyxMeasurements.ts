import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Midline coccyx inferior to sacrum, distinct from both coxal bones.
 *
 * Adult coccygeal segments may fuse; whole volume does not specify segment
 * count, sacrococcygeal mobility or posterior soft-tissue attachments.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCoccyxMeasurements {
  /** Coccygeal osseous volume excluding sacrum. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
