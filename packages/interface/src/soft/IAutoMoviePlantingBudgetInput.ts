import type { IAutoMoviePlantingCluster } from "./IAutoMoviePlantingCluster";
import type { IAutoMoviePlantingDomain } from "./IAutoMoviePlantingDomain";

/**
 * Recipe and optional multiplicity for counting the complete unpruned tree without emitting geometry. plantingBudget walks levels using the child count and maximum length jitter, and floors density times maximum branch length for eligible foliage levels. Growth stage and pruning do not reduce this upper report; declared caps are reported separately rather than clipping it.
 *
 * Callers must bound the recipe depth before this linear walk. This helper performs no validation, no pairing check and no allocation proportional to the reported population; unchecked products may overflow. Inputs are borrowed unchanged and the fresh scalar result is caller-owned. validatePlantingDomain uses the counts for admission and measureRenderSimulation uses requested-member products for cost.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives unpruned maximum-length counting, cap separation, optional multiplicity, ownership and unchecked arithmetic.
 * @evidence contracts/development/design.md#principled-representation Canonical recipe lengths in metres and density per metre yield integer population estimates; cluster count is requested multiplicity rather than accepted placements.
 * @evidence contracts/development/design.md#minimal-and-owned-surface plantingBudget serves recipe admission and render accounting through the same domain and optional cluster, with no tree or geometry cost surrogate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional cluster has the explicit one-member meaning; no recipe/cluster identity relationship or feasibility is inferred from their presence.
 */
export type IAutoMoviePlantingBudgetInput = {
  /** Recipe supplying bounded levels, branching, maximum length jitter, optional foliage and declared branch/leaf caps; no admission runs inside plantingBudget. */
  domain: IAutoMoviePlantingDomain;

  /** Only count is read, multiplying both population estimates; omission means one member. Count is requested, not the number accepted by arrangement. */
  cluster?: IAutoMoviePlantingCluster | undefined;
};
