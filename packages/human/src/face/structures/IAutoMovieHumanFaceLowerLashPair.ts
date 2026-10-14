import type { IAutoMovieHumanFaceLowerLashPopulation } from "../anatomy/lash/IAutoMovieHumanFaceLowerLashPopulation";

/**
 * The lower lash row's profile for each eye.
 *
 * Each side takes an explicit shaft count and the lower profile, whose angles
 * use the lower row's mirrored live globe-to-root frame and whose bounds are a stated convention.
 * Count is independent of the upper row and zero emits no shafts on that side.
 *
 * @evidence contracts/common.md#principled-implementation Explicit left/right lower-row populations use the mirrored live globe-to-root profile and independent counts rather than inferring follicles from source card geometry.
 * @evidence contracts/common.md#clear-and-simple-design Each anatomical eye owns one complete lower population; the parent Lashes record independently selects upper and lower replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertHumanFaceLashPopulation requires the rendering count in [0,1024] and validates the retained lower profile even for zero; conventional angular bounds are not physiological capacity measurements.
 * @evidence contracts/common.md#meaningful-documentation Side identity, lower angular frame and zero emission are explicit, separate from upper-row count and fan.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair declaration performs no root sampling or shaft integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares independent profiles without caching shared geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No emitted lash mesh or contact query is retained by this record.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashPair {
  /** Lower lash profile of the anatomical left eye. */
  left: IAutoMovieHumanFaceLowerLashPopulation;

  /** Lower lash profile of the anatomical right eye. */
  right: IAutoMovieHumanFaceLowerLashPopulation;
}
