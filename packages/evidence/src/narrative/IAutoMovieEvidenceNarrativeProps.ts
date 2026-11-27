import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IAutoMovieEvidenceProductionConstruction } from "./IAutoMovieEvidenceProductionConstruction";
import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";

/**
 * Opts into narrative evidence using native claims and selected authored
 * stages.
 */
export interface IAutoMovieEvidenceNarrativeProps {
  /**
   * Long retains four layers; short writes its brief canon, then the
   * screenplay, with no treatments, scripts or outline.
   */
  mode: "long" | "short";

  /**
   * Unspecified layers are disabled drafts; an omitted outline follows
   * settings.
   */
  construction?: Partial<IAutoMovieEvidenceProductionConstruction>;

  /** Defaults to the complete work; a pilot must identify its exact first part. */
  scope?: AutoMovieEvidenceNarrativeScope;

  /** Additional native claims for the production's actual respondents. */
  claims?: IEvidenceClaim[];
}
