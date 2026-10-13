import { AutoMovieSoftAnalysisKind } from "./AutoMovieSoftAnalysisKind";
import { AutoMovieSoftAnalysisStatus } from "./AutoMovieSoftAnalysisStatus";

/**
 * What a domain's analysis actually did, and what it declined to claim.
 *
 * An unsupported or unexecuted analysis is reported here, never dressed as a
 * success: a panel drawn in its rest shape because the solver could not honour
 * what it was asked for is a _reported_ rest shape, not a simulation that
 * happened to look still.
 */
export interface IAutoMovieSoftAnalysis {
  /** Identity of the analysed domain. */
  domain: string;

  /** Which analysis was asked for. */
  kind: AutoMovieSoftAnalysisKind;

  /** What the analysis was able to produce. */
  status: AutoMovieSoftAnalysisStatus;

  /** Why, in one sentence, when the status is not a plain success. */
  reason: string | null;

  /** Capabilities the record asked for that this tier does not provide. */
  unsupported: string[];
}
