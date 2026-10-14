import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";

/**
 * Independent audience-language revision stages for a finished film script.
 *
 * @evidence contracts/common.md#principled-implementation One explicit screenplay lifecycle value selects the final audience-language revision population.
 * @evidence contracts/common.md#clear-and-simple-design The nested map separates expression completion from construction completion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No extra revision branch or missing-stage default is admitted by its runtime validator.
 * @evidence contracts/common.md#meaningful-documentation The screenplays field refers to docs/final/screenplays rather than construction hosts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; validateAutoMovieNaturalnessStages admits the caller map and revisionStage reads it, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; validateAutoMovieNaturalnessStages admits the caller map and revisionStage reads it, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; validateAutoMovieNaturalnessStages admits the caller map and revisionStage reads it, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieNaturalnessStages {
  /** Final-screenplay revision under `docs/final/screenplays`. */
  screenplays: AutoMovieEvidenceStage;
}
