/**
 * Names a production's skills tree relative to its own directory.
 *
 * A standalone production holds its bundled contracts here; a workspace
 * production holds them in the tree the configuration's `skills` option points
 * at. Either way the production's own `work` and `language` contracts live in
 * its `docs/contracts`, never in a skills tree; this tree's
 * `contracts/story/{work,language}` is the retired location
 * assertProductionContractLayout refuses.
 *
 * Principled implementation: The scaffold installs `.agents/skills` at a production's root; this spelling is that layout contract, written with portable separators because Evidence reference roots are portable relative paths.
 * Clear and simple design: One constant supplies the default shared tree, the default engineering, development and research reference roots, and the retired location the layout guard probes.
 * Prohibited implementation shortcuts: The value is the installed layout, not a fixture or host path; a workspace overrides the shared tree through `skills`.
 * Meaningful documentation: The prose states which contracts live here in standalone and workspace productions.
 * Efficient algorithms: A constant string with no computation.
 * Reuse equivalent work: Every consumer reads the same immutable string.
 * Bound retention and release resources: One fixed string for the module lifetime.
 */
export const SKILLS_ROOT: string = ".agents/skills";
