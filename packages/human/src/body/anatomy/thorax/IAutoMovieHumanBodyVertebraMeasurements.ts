import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One named presacral vertebra measured independently of adjacent levels.
 *
 * Its scalar bone volume does not determine the spinal canal, facet joints, disc height or the individual's kyphosis/lordosis; C1 also lacks the ordinary vertebral body and is therefore not given a generic body height.
 *
 * @evidence contracts/common.md#principled-implementation One required osseous-volume carrier preserves a presacral vertebra's target or segmented observation independently of adjacent levels.
 * @evidence contracts/common.md#clear-and-simple-design Numbered collections own vertebral identity while the common volume type owns units and acquisition provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A volume scalar cannot supply canal/facet/disc geometry or individual spinal curvature; C1 receives no invented generic body height.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies osseous-only ownership and distinguishes atlas anatomy from ordinary vertebral bodies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Vertebral volume typing performs no canal reconstruction, endplate fitting or curvature solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An individual vertebral input stores no previously reconstructed facet/disc result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Vertebra metadata owns no canal mesh, segmented voxels or spine-registration task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyVertebraMeasurements {
  /** This numbered vertebra's osseous volume only. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
