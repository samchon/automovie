import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/**
 * Declares that no narrative layer is checked, for a screenplay no narrative
 * pass writes.
 */
export interface IAutoMovieEvidenceNoNarrativeProps {
  /**
   * Checks no narrative layer; with an enabled composition stage, the
   * composition and entities must realize every instruction section instead.
   */
  mode: "none";

  /** Additional native claims for the production's actual respondents. */
  claims?: IEvidenceClaim[];
}
