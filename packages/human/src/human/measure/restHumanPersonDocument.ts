import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Deep-copy the person, remove body pose/shoulders and replace face expression with an empty owner-neutral record. All other fields, including anatomicalMotion, toes, thighGoals and optional oral/regional performance, remain unchanged. This helper alone therefore does not establish a completely standing/neutral full-build posture; those retained requests still follow their owning evaluator.
 *
 * @evidence contracts/common.md#principled-implementation Explicit pose/shoulder omission and empty expression prepare the existing measurement path without editing identity or other numerical source requests.
 * @evidence contracts/common.md#clear-and-simple-design One document-copy helper selects only its three actual omissions; body pose resolution and face performance retain normal ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained motion/performance goals are not claimed neutralized, and caller records are neither mutated nor implicitly clamped to a measurement result.
 * @evidence contracts/common.md#meaningful-documentation Prose names exact cleared and retained fields and the remaining full-posture validation boundary.
 * @evidence contracts/performance.md#efficient-algorithms Structured cloning visits the actual document graph; two deletions and one expression replacement add fixed work without geometry evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutable document needs its own detached copy; no cross-document posture cache or request coordinator is implemented.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the deep-copied document escapes to its caller; no original document/source buffer or task is retained.
 */
export function restHumanPersonDocument(
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonDocument {
  const rest: IAutoMovieHumanPersonDocument = structuredClone(document);
  delete rest.body.pose;
  delete rest.body.shoulders;
  rest.face.expression = {};
  return rest;
}
