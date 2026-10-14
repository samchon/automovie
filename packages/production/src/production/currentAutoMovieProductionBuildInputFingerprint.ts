
import { IAutoMovieBuildProjectInput } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { currentAutoMovieProductionBuildInputFingerprintWithEvidence } from "./currentAutoMovieProductionBuildInputFingerprintWithEvidence";

/**
 * Read the current timed-builder identity without graph-selected authoring evidence.
 *
 * This compatibility entry passes undefined evidence to the companion reader. It returns the companion's current digest or null refusal; callers requiring owner-edge identity must use the evidence-aware entry.
 *
 * @evidence contracts/common.md#principled-implementation Delegation preserves one scope/read/error policy and intentionally excludes absent authoring evidence. No source is executed or generated output published by this projection.
 * @evidence contracts/common.md#clear-and-simple-design A small project-only entry exposes the existing optional-evidence contract without duplicating source/content/derivation traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined evidence contributes no owner field; this is not proof that the project's actual evidence population is empty. The entry does not substitute a source-success result for a read refusal.
 * @evidence contracts/common.md#meaningful-documentation Documents the omitted evidence dependency, companion null/error policy and the correct entry for owner-aware currentness.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the full companion graph serialization, source/content reading and derivation inspection, not merely this one forwarding call.
 * @evidence contracts/performance.md#reuse-equivalent-work No currentness result is retained here; the companion observes current inputs on each invocation and owns any within-call payload reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The entry returns only a digest/null and borrows the project; companion readers own temporary bytes and handle cleanup, without a task or cache in this wrapper.
 */
export function currentAutoMovieProductionBuildInputFingerprint(
  project: AutoMovieProductionProject,
  scope: IAutoMovieBuildProjectInput["scope"]
): string | null { return currentAutoMovieProductionBuildInputFingerprintWithEvidence(
    project,
    scope,
    undefined,
  ); }
