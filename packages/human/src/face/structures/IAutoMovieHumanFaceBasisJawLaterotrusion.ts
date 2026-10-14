import type { IAutoMovieHumanFaceBasisJawTranslation } from "./IAutoMovieHumanFaceBasisJawTranslation";

/**
 * The two sideways mandibular translations, one channel per side.
 *
 * @evidence contracts/common.md#principled-implementation Independent anatomical-left/right authored translations add to one mandibular rigid motion, separately from opening/protrusion's sagittal budget.
 * @evidence contracts/common.md#clear-and-simple-design Two named sides reuse JawTranslation without duplicated vector fields or a shared signed channel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source endpoints establish no universal clinical range or simultaneous-extreme physical guarantee.
 * @evidence contracts/common.md#meaningful-documentation Members identify the subject's left/right; the reused owner states weight-one metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema runs no translation composition or contact query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side identity defines no motion cache or shared endpoint evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns both records; this type acquires no mesh or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawLaterotrusion {
  /** Translation toward the subject's left. */
  left: IAutoMovieHumanFaceBasisJawTranslation;

  /** Translation toward the subject's right. */
  right: IAutoMovieHumanFaceBasisJawTranslation;
}
