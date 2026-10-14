import type { IAutoMovieAcceptanceScenario } from "@automovie/interface";
import { acceptanceCriterionShots } from "./acceptanceCriterionShots";

/**
 * Whether a scenario explicitly targets or reads the exact shot ID.
 *
 * @evidence contracts/common.md#principled-implementation Combines an exact shot target with criterion-read dependencies; AutoMovieProductionProject uses the result for shot references and review invalidation so cross-shot criteria remain affected by every addressed shot.
 * @evidence contracts/common.md#clear-and-simple-design Keeps target-or-dependency policy in one predicate while acceptanceCriterionShots owns family-specific dependency extraction; it performs no graph mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses exact IDs and both authored sources of dependency, without prefix matching or treating a film target as an implicit reference to every shot.
 * @evidence contracts/common.md#meaningful-documentation States explicit target and read semantics; a true result does not prove that the shot exists or that its acceptance criterion passes.
 * @evidence contracts/performance.md#efficient-algorithms An exact target match short-circuits after fixed field comparisons; otherwise dependency extraction and includes visit O(E) story-sync points with temporary arrays, plus id hashing/equality text costs. Other families inspect a fixed field population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The predicate computes one mutable scenario's relation to one ID; graph-level callers own repeated folds, and no stale dependency cache is introduced for a cheap typed projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one boolean and releases dependency temporaries after the call; it retains no scenario, graph, handle or task.
 */
export function acceptanceAddressesShot(scenario: IAutoMovieAcceptanceScenario, shot: string): boolean {
  return (scenario.target.kind === "shot" && scenario.target.id === shot) ||
    acceptanceCriterionShots(scenario).includes(shot);
}
