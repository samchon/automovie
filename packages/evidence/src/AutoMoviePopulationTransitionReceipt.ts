import type { IAutoMovieFilmPopulationTransitionReceipt } from "./IAutoMovieFilmPopulationTransitionReceipt";
import type { IAutoMovieLibraryPopulationTransitionReceipt } from "./IAutoMovieLibraryPopulationTransitionReceipt";


/**
 * Historical predecessor accepted by a complete-production reset.
 *
 * @evidence contracts/common.md#principled-implementation A film-or-library discriminated union admits only the two historical predecessor representations supported by a complete-production reset.
 * @evidence contracts/common.md#clear-and-simple-design The common receipt boundary delegates film ladder fields and library pair fields to their separate record owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No brief receipt or arbitrary predecessor shape is introduced to bypass reset admission.
 * @evidence contracts/common.md#meaningful-documentation The comment names historical predecessor purpose; each variant documents its protocol, location, owner and retained population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The transition receipt union has no executable reset algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A predecessor union does not reuse or certify a review; its validator compares the actual current host population.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased receipt union allocates neither film nor library variant; receipt creators return their records to callers and validateAutoMoviePopulationTransition borrows them during admission.
 *
 * @author Samchon
 */
export type AutoMoviePopulationTransitionReceipt =
  | IAutoMovieFilmPopulationTransitionReceipt
  | IAutoMovieLibraryPopulationTransitionReceipt;
