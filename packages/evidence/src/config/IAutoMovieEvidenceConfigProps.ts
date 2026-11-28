import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieEvidenceDevelopmentProps } from "../development/IAutoMovieEvidenceDevelopmentProps";
import type { IAutoMovieEvidenceNarrativeProps } from "../narrative/IAutoMovieEvidenceNarrativeProps";
import type { IAutoMovieEvidenceNoNarrativeProps } from "../narrative/IAutoMovieEvidenceNoNarrativeProps";

/** Selects engineering and optional production Evidence claim families. */
export interface IAutoMovieEvidenceConfigProps {
  /** Absolute project directory containing the production-owned contracts. */
  location: string;

  /**
   * Path to the shared skills tree, absolute or relative to `location`.
   *
   * Omit it when the production has its own `.agents/skills`. In a workspace,
   * name the workspace's tree. The production keeps its work and language
   * contracts under its own `docs/contracts` in either case.
   */
  skills?: string;

  /** Native claims appended to the engineering claims with their own roots. */
  claims?: IEvidenceClaim[];

  /**
   * Omit for engineering and standalone assets. Select a narrative route for
   * authored stages or use `mode: "none"` for a supplied screenplay.
   */
  narrative?:
    | IAutoMovieEvidenceNarrativeProps
    | IAutoMovieEvidenceNoNarrativeProps;

  /** Selects development claims for the commissioned production. */
  development?: IAutoMovieEvidenceDevelopmentProps;

  /**
   * Overrides research selection. A short defaults to selecting its studies
   * once a file exists beyond the index. Other routes default to disabled.
   */
  research?: "disabled" | "evidence";
}
