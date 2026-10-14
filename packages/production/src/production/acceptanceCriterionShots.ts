import type { IAutoMovieAcceptanceScenario } from "@automovie/interface";

/**
 * Read a criterion's shot dependencies once each in first-declared order.
 *
 * @evidence contracts/common.md#principled-implementation Story-sync events name every dependent shot and Set deduplication preserves first occurrence; metric criteria have no shot and other typed criteria supply at most one. Production project reference and invalidation folds use these dependencies when acceptance or a shot changes.
 * @evidence contracts/common.md#clear-and-simple-design Owns criterion-read dependencies separately from the scenario's explicit target; acceptanceAddressesShot combines them when finding references to one shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No selected shot or criterion ID bypasses dependency accounting; missing optional shot means no criterion dependency rather than a fabricated owner.
 * @evidence contracts/common.md#meaningful-documentation States distinct ordering and criterion-family behavior; the returned list describes direct authored addresses, not existence validation or a transitive graph closure.
 * @evidence contracts/performance.md#efficient-algorithms For E story-sync points, mapping and Set construction use O(E) expected set operations plus id hashing/equality text costs, retaining U distinct shot references and the mapped E-element temporary. Other families inspect a fixed field population and return at most one reference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This projection reads one mutable scenario and performs no domain measurement; its caller owns graph-wide repeated dependency decisions, while a retained result would need scenario-content equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary Set and mapped addresses are local, and the new array transfers to the caller; no graph store, handle or task is retained.
 */
export function acceptanceCriterionShots(scenario: IAutoMovieAcceptanceScenario): string[] {
  const criterion: IAutoMovieAcceptanceScenario["criterion"] = scenario.criterion;
  if (criterion.kind === "story-sync")
    return [...new Set(criterion.events.map(
      (entry: Extract<IAutoMovieAcceptanceScenario["criterion"], {kind:"story-sync"}>["events"][number]): string => entry.shot,
    ))];
  if (criterion.kind === "metric") return [];
  return criterion.shot === undefined ? [] : [criterion.shot];
}
