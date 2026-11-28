import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/** Selects native claims for a screenplay supplied directly to production. */
export interface IAutoMovieEvidenceNoNarrativeProps {
  /**
   * Skips narrative layer checks. Enabled composition checks account for the
   * direct production instructions when that directory is present.
   */
  mode: "none";

  /** Leaves narrative scope absent because this route authors no layers. */
  scope?: never;

  /** Adds native claims after the engineering and development claims. */
  claims?: IEvidenceClaim[];
}
