import { AutoMovieRepaintRawOutputDisposition } from "./AutoMovieRepaintRawOutputDisposition";

/**
 * Admit the five supported raw-retention dispositions without inferring media usability or selected delivery.
 *
 * @evidence contracts/common.md#principled-implementation Exact comparisons against the closed candidate-source/invalid/partial/cancelled/budget-exhausted vocabulary reject foreign labels.
 * @evidence contracts/common.md#clear-and-simple-design One runtime vocabulary predicate serves raw planning and stored-receipt admission while execution and selection keep separate policies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate-source is not automatically valid media and unsuccessful retained output is not relabelled as a delivery candidate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives the disposition-only boundary and excluded media/selection meaning.
 * @evidence contracts/performance.md#efficient-algorithms At most five exact string comparisons use constant additional storage with cost limited by the compared label lengths.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The vocabulary check owns no provider task coordinator or cached admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and neither supplied label nor output buffers are retained.
 */
export const productionRepaintRawIsDisposition: (value: AutoMovieRepaintRawOutputDisposition) => boolean = (value: AutoMovieRepaintRawOutputDisposition): boolean =>
  value === "candidate-source" ||
  value === "invalid" ||
  value === "partial" ||
  value === "cancelled" ||
  value === "budget-exhausted";
