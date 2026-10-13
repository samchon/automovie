import { AutoMovieSoftAnalysisKind } from "./AutoMovieSoftAnalysisKind";
import { AutoMovieSoftAnalysisStatus } from "./AutoMovieSoftAnalysisStatus";

/**
 * What a domain's analysis actually did, and what it declined to claim.
 *
 * An unsupported or unexecuted analysis is reported here, never dressed as a success: a panel drawn in its rest shape because the solver could not honour what it was asked for is a _reported_ rest shape, not a simulation that happened to look still.
 *
 * @evidence contracts/common.md#principled-implementation lowerSoftFurnishing distinguishes solved, rest, unsupported and not-run outcomes; lowerPlantingInstallation reports derived or not-run after resolving its recipe and cluster.
 * @evidence contracts/common.md#clear-and-simple-design One report carries domain identity, computation kind and outcome beside the returned state instead of encoding failure as invisible geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-collision requests produce an unsupported rest result, not a solved claim; invalid bindings and exhausted solve budgets produce no computed state.
 * @evidence contracts/common.md#meaningful-documentation Members separate outcome from explanatory reason and unsupported capabilities; a report is not an assurance of continuous collision-free motion.
 * @author Samchon
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
