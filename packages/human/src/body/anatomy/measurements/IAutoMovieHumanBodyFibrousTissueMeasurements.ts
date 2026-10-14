import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One specifically named ligament, fascial tract or aponeurotic sheet.
 *
 * MRI/CT volume or a fictional target is a material quantity, not a tendon path, collagen direction, stiffness or skin displacement. The owning part supplies the anatomical identity and named bone/muscle attachments.
 *
 * @evidence contracts/common.md#principled-implementation A named fibrous tissue uses anatomical volume provenance while keeping quantity separate from mechanical/path properties.
 * @evidence contracts/common.md#clear-and-simple-design Ligament, fascial tract or aponeurosis identity belongs to its owning part rather than an anonymous tissue bucket.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A volume alone does not supply tendon paths, collagen direction, stiffness or skin displacement.
 * @evidence contracts/common.md#meaningful-documentation Member and declaration comments explain millilitre quantity ownership and required external anatomical attachments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fibrous tissue typing executes no tendon routing or collagen mechanics computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This material quantity record shares no equivalent stiffness or deformation calculation across parts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fibrous metadata owns no tendon-path arrays, mechanical solver state or viewer resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyFibrousTissueMeasurements {
  /** Volume of this one named fibrous tissue, excluding adjacent muscle. */
  readonly tissueVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
