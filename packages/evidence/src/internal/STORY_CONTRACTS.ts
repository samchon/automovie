/**
 * Names the story contract tree inside a skills tree.
 *
 * Its `shared/` family ships with the scaffold's bundled skills. The `work/`
 * and `language/` families a production adopts live in its `docs/contracts`
 * instead; under a production's own skills tree they mark the retired layout.
 *
 * Principled implementation: The scaffold installs story contracts at `contracts/story` under a skills tree; the portable spelling joins the shared skills tree for shared contracts and the research root, and the production's own skills tree only for the retired-layout guard.
 * Clear and simple design: One constant serves every shared story root and the legacy guard.
 * Prohibited implementation shortcuts: The value is the installed layout, not a fixture path.
 * Meaningful documentation: The prose names the families and which tree owns each.
 * Efficient algorithms: A constant string with no computation.
 * Reuse equivalent work: Every consumer reads the same immutable string.
 * Bound retention and release resources: One fixed string for the module lifetime.
 */
export const STORY_CONTRACTS: string = "contracts/story";
