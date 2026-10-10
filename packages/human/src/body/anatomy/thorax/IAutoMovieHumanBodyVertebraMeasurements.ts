import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One named presacral vertebra measured independently of adjacent levels.
 *
 * Its scalar bone volume does not determine the spinal canal, facet joints,
 * disc height or the individual's kyphosis/lordosis; C1 also lacks the
 * ordinary vertebral body and is therefore not given a generic body height.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyVertebraMeasurements {
  /** This numbered vertebra's osseous volume only. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
