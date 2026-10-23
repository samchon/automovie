import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieNarrativeProps } from "./IAutoMovieNarrativeProps";

/**
 * Configures a project's engineering evidence and optional narrative workflow.
 *
 * @evidence contracts/common.md#principled-implementation The absolute project location anchors contract discovery; native claims configure engineering while an explicit narrative option adds creative relationships and independent-review structure.
 * @evidence contracts/common.md#clear-and-simple-design One object contains author choices; the package derives runtime identity and stage defaults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No narrative mode is inferred from existing files or imposed on ordinary coding and standalone assets.
 * @evidence contracts/common.md#meaningful-documentation Members state path ownership, replacement semantics for engineering claims, and narrative opt-in behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type implements no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input type coordinates no requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input type owns no runtime resources.
 */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute project directory containing the production-owned contracts. */
  location: string;

  /** Replaces the default source/test engineering claims when supplied. */
  claims?: IEvidenceClaim[];

  /** Omit for ordinary coding and standalone assets; provide for video writing. */
  narrative?: IAutoMovieNarrativeProps;
}
