import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Deep medial hamstring from ischial tuberosity to posteromedial tibia. Its belly is not a second copy of semitendinosus.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation A separate semimembranosus alias reuses quantitative muscle volume/composition input for its own medial hamstring belly.
 * @evidence contracts/common.md#clear-and-simple-design Deep medial hamstring identity remains named while common quantity/provenance structure stays shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semimembranosus is not another copy of semitendinosus or inferred posterior skin.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes this independent belly and physical volume/MRI-fat controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Semimembranosus input typing performs no deep-hamstring geometry algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Deep medial belly records retain no cached hamstring composition estimate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The semimembranosus alias owns no segmented posterior-thigh mesh or task.
 * @author Samchon
 */
export type IAutoMovieHumanBodySemimembranosusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
