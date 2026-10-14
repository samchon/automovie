import { IAutoMovieProductionDesign, IAutoMovieModelRecipe, IAutoMovieWorldDesign, IAutoMovieFormationDesign, IAutoMovieShotContract, IAutoMovieAcceptanceScenario } from "@automovie/interface";

/**
 * Structurally admitted caller-owned production records used for deterministic cross-reference validation. Null singleton records denote absence; keyed maps retain their loaded identities and order. Semantic admission is separate, and the graph type cannot guarantee an atomic filesystem snapshot or compiled realization.
 *
 * @evidence contracts/common.md#principled-implementation Optional singletons and readonly keyed maps preserve the exact loaded production, shared models/world, formations, shots and acceptance populations consumed by graph admission.
 * @evidence contracts/common.md#clear-and-simple-design One graph carrier connects typed project reads, staged mutation checks and build validation without a second schema or source host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly maps do not deep-freeze mutable record values or certify semantic validity; absence stays null and each owner supplies its actual current records.
 * @evidence contracts/common.md#meaningful-documentation Members define record ownership and keyed identity; the prose distinguishes schema admission, optional absence and snapshot/realization limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record type performs no graph scan, file read or diagnostic sort.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema owns no graph cache; loaders and mutation/build consumers control current-record acquisition and reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no file handle, compiler or task; caller graph maps own their referenced record lifetime.
 * @author Samchon
 */
export interface IAutoMovieProductionDesignGraph {
  /**
   * Caller-owned active production record; null means no admitted record is available.
   */
  production: IAutoMovieProductionDesign | null;

  /**
   * Loaded model recipes keyed by record identity; readonly map access does not freeze recipe values.
   */
  models: ReadonlyMap<string, IAutoMovieModelRecipe>;

  /**
   * Caller-owned project-shared world record; null leaves world-dependent checks unavailable.
   */
  world: IAutoMovieWorldDesign | null;

  /**
   * Loaded formations keyed by record identity, preserving loader iteration order.
   */
  formations: ReadonlyMap<string, IAutoMovieFormationDesign>;

  /**
   * Loaded shot contracts keyed by record identity, including their declared source and review addresses.
   */
  shots: ReadonlyMap<string, IAutoMovieShotContract>;

  /**
   * Loaded acceptance scenarios keyed by record identity; declarations retain separate observation obligations.
   */
  acceptance: ReadonlyMap<string, IAutoMovieAcceptanceScenario>;
}
