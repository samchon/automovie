import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieDevelopmentProps } from "./IAutoMovieDevelopmentProps";
import type { IAutoMovieNarrativeProps } from "./IAutoMovieNarrativeProps";

/**
 * Configures a project's engineering evidence and optional narrative workflow.
 *
 * @evidence contracts/development/design.md#principled-representation The absolute project location anchors the production's own contracts and an optional absolute skills directory anchors the bundled shared ones; native claims configure engineering while an explicit narrative option adds creative relationships and independent-review structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One object contains the two contract locations, native engineering claims and optional narrative choices with disabled stage defaults.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No narrative mode is inferred from existing files or imposed on ordinary coding and standalone assets, and no workspace is inferred from the filesystem: a shared tree elsewhere is named explicitly.
 * @evidence contracts/development/common.md#meaningful-documentation Members state path ownership, the shared tree's default, replacement semantics for engineering claims, and narrative opt-in behavior.
 */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute project directory containing the production-owned contracts. */
  location: string;

  /**
   * Absolute directory of the shared `.agents/skills` tree holding the bundled
   * contracts.
   *
   * The engineering and development checklists (`contracts/development/**`)
   * and the shared story contracts (`contracts/story/shared/**`) resolve here.
   * The production's own `work/**` and `language/**` contracts always resolve
   * under `<location>/docs/contracts`, never here. A workspace
   * production passes the workspace root's tree; a standalone production omits
   * it. Citation addresses are the same either way; only reference roots
   * change.
   *
   * @default path.join(location, ".agents", "skills")
   */
  skills?: string;

  /** Replaces the default source/test engineering claims when supplied. */
  claims?: IEvidenceClaim[];

  /** Omit for ordinary coding and standalone assets; provide for video writing. */
  narrative?: IAutoMovieNarrativeProps;

  /** Entity, behavior and composition development contracts; omitted stages stay disabled. */
  development?: IAutoMovieDevelopmentProps;

  /** Research studies answer the story research principles when `"evidence"`; disabled by default. */
  research?: "disabled" | "evidence";
}
