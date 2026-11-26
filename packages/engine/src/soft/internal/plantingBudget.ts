import {
  IAutoMoviePlantingBudget,
  type IAutoMoviePlantingBudgetInput,
  IAutoMoviePlantingFoliage,
  IAutoMoviePlantingStructure,
} from "@automovie/interface";

/**
 * Measure a planting recipe's complete-tree branch/leaf upper counts and
 * optional requested member products without deriving geometry. Callers admit
 * bounded depth first; numeric products can overflow for unsupported huge
 * ungated values.
 */
export function plantingBudget(
  props: IAutoMoviePlantingBudgetInput,
): IAutoMoviePlantingBudget {
  const { domain }: typeof props = props;
  const structure: IAutoMoviePlantingStructure = domain.structure;
  const foliage: IAutoMoviePlantingFoliage | null = domain.foliage;
  const children: number = structure.children.length;
  const spread: number = 1 + structure.lengthJitter;
  let worstCaseBranches: number = 0;
  let worstCaseLeaves: number = 0;
  let level: number = 1;
  let reach: number = structure.length * spread;
  for (let at: number = 0; at < structure.levels; ++at) {
    worstCaseBranches += level;
    if (foliage !== null && at >= foliage.minLevel)
      worstCaseLeaves += level * Math.floor(foliage.density * reach);
    level *= children;
    reach *= structure.lengthRatio * spread;
  }
  const members: number = props.cluster === undefined ? 1 : props.cluster.count;
  return {
    domain: domain.id,
    worstCaseBranches,
    worstCaseLeaves,
    maxBranches: domain.budget.maxBranches,
    maxLeaves: domain.budget.maxLeaves,
    members,
    worstCaseBranchInstances: worstCaseBranches * members,
    worstCaseLeafInstances: worstCaseLeaves * members,
  };
}
