/**
 * Names the tree of a production's own contracts, relative to its directory.
 *
 * The `work` and `language` families a production adopts live here directly,
 * with no `story` level, so `work/discovery/results.md` is the file
 * `docs/contracts/work/discovery/results.md` and is cited by that same
 * family-qualified address. They sit beside the production's other documents
 * rather than in a skills tree, so a workspace's shared `.agents/skills` holds
 * only bundled contracts.
 *
 * Principled implementation: The scaffold places production-owned contracts under `docs/contracts`; the portable spelling is used both as a reference root and, split on `/`, as a filesystem path under the production location.
 * Clear and simple design: One constant supplies every production-owned root: local language references, the discovery claim over `work/**`, and the work-local package claims.
 * Prohibited implementation shortcuts: The value is the installed layout, not a fixture path; no fallback to the retired `.agents/skills/contracts/story` location exists, which assertProductionContractLayout refuses instead.
 * Meaningful documentation: The prose states which families live here, the address-to-file mapping and why they are outside the skills tree.
 * Efficient algorithms: A constant string with no computation.
 * Reuse equivalent work: Every consumer reads the same immutable string.
 * Bound retention and release resources: One fixed string for the module lifetime.
 */
export const PRODUCTION_CONTRACTS: string = "docs/contracts";
