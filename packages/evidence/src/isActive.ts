import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";

/**
 * Every lifecycle value except disabled is an active authored or source branch.
 *
 * @evidence contracts/common.md#principled-implementation Every lifecycle value except disabled is an active authored or source branch.
 * @evidence contracts/common.md#clear-and-simple-design This predicate is separate from completion because draft still requires physical hosts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing-host exception is encoded in stage classification; declaration validation owns the closed vocabulary.
 * @evidence contracts/common.md#meaningful-documentation The result means active population, not paid evidence coverage.
 * @evidence contracts/performance.md#efficient-algorithms One string comparison has constant branch work.
 * @evidence contracts/performance.md#reuse-equivalent-work The pure predicate is reused by stage and topology checks without a cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; the helper owns no state or resources.
 */
export function isActive(stage: AutoMovieEvidenceStage): boolean {
  return stage !== "disabled";
}
