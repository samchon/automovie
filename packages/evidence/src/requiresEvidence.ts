import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";

/**
 * Evidence and review stages enable native acknowledgment duties while draft and disabled do not.
 *
 * @evidence contracts/common.md#principled-implementation Evidence and review stages enable native acknowledgment duties while draft and disabled do not.
 * @evidence contracts/common.md#clear-and-simple-design Completion classification is distinct from active physical population classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The accepted review stage carries no implicit companion prose or freshness requirement.
 * @evidence contracts/common.md#meaningful-documentation A true result enables structural coverage gates rather than proving their success.
 * @evidence contracts/performance.md#efficient-algorithms Two equality checks have constant work and allocate no population.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared stage and claim consumers reuse this pure predicate without memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The boolean result is the only output and no retained state exists.
 */
export function requiresEvidence(stage: AutoMovieEvidenceStage): boolean {
  return stage === "evidence" || stage === "review";
}
