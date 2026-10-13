import { IAutoMoviePlantingBudget, IAutoMoviePlantingCluster, IAutoMoviePlantingDomain, IAutoMoviePlantingStructure, IAutoMoviePlantingFoliage } from "@automovie/interface";
/** Measure a planting recipe's complete-tree branch/leaf upper counts and optional requested member products without deriving geometry. Callers admit bounded depth first; numeric products can overflow for unsupported huge ungated values.
 *
 * @evidence contracts/common.md#principled-implementation Walking the declared child branching factor and accumulated maximum length jitter bounds unpruned branch and density-derived leaf populations across growth stages; pruning can only remove them. Separate declared caps are returned without replacing these derived counts.
 * @evidence contracts/common.md#clear-and-simple-design Domain admission and production render-simulation budgeting share one cost owner, while actual derivation enforces emitted caps independently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid enormous depth is not capped here into a plausible report; depth admission precedes this linear walk, and requested member count is not mistaken for accepted arrangement count.
 * @evidence contracts/common.md#meaningful-documentation States worst-case versus declared caps, depth premise and requested-member meaning.
 * @evidence contracts/performance.md#efficient-algorithms For admitted depth D, a scalar recurrence computes counts in O(D) time and constant extra storage, regardless of the potentially exponential derived population.
 * @evidence contracts/performance.md#reuse-equivalent-work One level/maximum-reach recurrence supplies both branch and leaf bounds; cheap scalar reports are recomputed for changed recipe/cluster values rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fixed fresh scalar report transfers to the caller; no tree, placement array or recipe handle is retained.
 *
 * @author Samchon
 */
export const plantingBudget: (props: { domain: IAutoMoviePlantingDomain; cluster?: IAutoMoviePlantingCluster | undefined; }) => IAutoMoviePlantingBudget = (props: {
  domain: IAutoMoviePlantingDomain;
  cluster?: IAutoMoviePlantingCluster;
}): IAutoMoviePlantingBudget => {
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
};
