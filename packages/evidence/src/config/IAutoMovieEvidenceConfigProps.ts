import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieEvidenceDevelopmentProps } from "../development/IAutoMovieEvidenceDevelopmentProps";
import type { IAutoMovieEvidenceNarrativeProps } from "../narrative/IAutoMovieEvidenceNarrativeProps";
import type { IAutoMovieEvidenceNoNarrativeProps } from "../narrative/IAutoMovieEvidenceNoNarrativeProps";

/** Configures a project's engineering evidence and optional narrative workflow. */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute project directory containing the production-owned contracts. */
  location: string;

  /**
   * Directory of the shared `.agents/skills` tree holding the bundled
   * contracts, absolute or relative to `location`.
   *
   * The engineering and development checklists (`contracts/development/**`) and
   * the shared story contracts (`contracts/story/**`) resolve here. The
   * production's own `work/**` and `language/**` contracts always resolve under
   * `<location>/docs/contracts`, never here. A workspace production passes the
   * workspace root's tree; a standalone production omits it. Citation addresses
   * are the same either way; only reference roots change.
   *
   * @default path.join(location, ".agents", "skills")
   */
  skills?: string;

  /** Native claims added to the default source and test engineering claims. */
  claims?: IEvidenceClaim[];

  /**
   * Omit for ordinary coding and standalone assets; provide a route for video
   * writing, or mode none for a screenplay no narrative pass writes.
   */
  narrative?: IAutoMovieEvidenceNarrativeProps | IAutoMovieEvidenceNoNarrativeProps;

  /**
   * Selects development contracts for entities, behaviors, composition and a
   * separate review catalog.
   */
  development?: IAutoMovieEvidenceDevelopmentProps;

  /**
   * Overrides research selection. By default a short selects all studies once
   * one exists beyond the index. Other routes leave research disabled.
   */
  research?: "disabled" | "evidence";
}
