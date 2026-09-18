import { IAutoMoviePlantingBudget, IAutoMoviePlantingCluster, IAutoMoviePlantingDomain } from "@automovie/interface";

/**
 * The bounded cost a planting recipe, and optionally its cluster, adds to a
 * shot.
 *
 * Nothing here grows a branch: a production is refused for an unaffordable
 * green wall before the first derivation, and the same numbers ride into the
 * builder's report so a reviewer sees what the planting cost.
 *
 * The worst case is the complete `k`-ary tree of depth `levels`, which is what
 * an unpruned recipe at full growth actually emits.
 *
 * Foliage is counted the same way rather than read off the declared cap. A
 * branch at level `l` is no longer than
 *
 * ```text
 *   Λ(l) = length · lengthRatio^l · (1 + lengthJitter)^(l + 1)
 * ```
 *
 * One jitter draw per generation and each strictly below its own bound, and it
 * bears `⌊density · Λ(l)⌋` blades. The worst case is that count summed over the
 * complete tree from `minLevel` down. Growth and pruning only ever shorten a
 * branch, so the number bounds every state the recipe can be in.
 *
 * Both totals are counted by **walking the declared depth**, so this is only
 * asked of a recipe whose `structure.levels` is already known to be inside
 * {@link PLANTING_MAX_LEVELS}: a record claiming a quadrillion levels would
 * otherwise be walked a quadrillion times by the very report that exists to
 * price it. {@link validatePlantingDomain} refuses such a depth on its own path
 * and only measures once it is in range, which is the order any other caller
 * follows too.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Prices the worst-case branch, leaf, and member work before derivation.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Supplies the bounded-work account of an interior planting.
 * @author Samchon
 */
export const plantingBudget = (props: {
  domain: IAutoMoviePlantingDomain;
  cluster?: IAutoMoviePlantingCluster;
}): IAutoMoviePlantingBudget => {
  const { domain } = props;
  const structure = domain.structure;
  const foliage = domain.foliage;
  const children = structure.children.length;
  const spread = 1 + structure.lengthJitter;
  let worstCaseBranches = 0;
  let worstCaseLeaves = 0;
  let level = 1;
  let reach = structure.length * spread;
  for (let at = 0; at < structure.levels; ++at) {
    worstCaseBranches += level;
    if (foliage !== null && at >= foliage.minLevel)
      worstCaseLeaves += level * Math.floor(foliage.density * reach);
    level *= children;
    reach *= structure.lengthRatio * spread;
  }
  const members = props.cluster === undefined ? 1 : props.cluster.count;
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
