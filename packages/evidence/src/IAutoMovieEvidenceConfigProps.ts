import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieDevelopmentProps } from "./IAutoMovieDevelopmentProps";
import type { IAutoMovieNarrativeProps } from "./IAutoMovieNarrativeProps";
import type { IAutoMovieNoNarrativeProps } from "./IAutoMovieNoNarrativeProps";

/**
 * Configures a project's engineering evidence and optional narrative workflow.
 *
 * @evidence contracts/development/design.md#principled-representation The absolute project location anchors the production's own contracts and an optional skills directory, absolute or relative to that location, anchors the bundled shared ones; native claims configure engineering while an explicit narrative option adds creative relationships and independent-review structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One object contains the two contract locations, native engineering claims and optional narrative choices, a route with disabled stage defaults or none.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No narrative mode is inferred from existing files or imposed on ordinary coding and standalone assets, and no workspace is inferred from the filesystem: a shared tree elsewhere is named explicitly.
 * @evidence contracts/development/common.md#meaningful-documentation Members state path ownership, the shared tree's default, that supplied claims add to the engineering defaults, and narrative opt-in behavior.
 */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute project directory containing the production-owned contracts. */
  location: string;

  /**
   * Directory of the shared `.agents/skills` tree holding the bundled
   * contracts, absolute or relative to `location`.
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

  /** Native claims added to the default source and test engineering claims. */
  claims?: IEvidenceClaim[];

  /** Omit for ordinary coding and standalone assets; provide a route for video writing, or mode none for a screenplay written outside the narrative layers. */
  narrative?: IAutoMovieNarrativeProps | IAutoMovieNoNarrativeProps;

  /** Entity, behavior and composition development contracts; omitted stages stay disabled. */
  development?: IAutoMovieDevelopmentProps;

  /** Research studies answer the story research principles when `"evidence"`; disabled by default. */
  research?: "disabled" | "evidence";
}
