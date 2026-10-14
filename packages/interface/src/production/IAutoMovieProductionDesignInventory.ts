/**
 * Compact inventory of typed design records returned by project inspection.
 *
 * @evidence contracts/common.md#principled-implementation productionProjectInventory acquires the current schema-admitted resident graph, then copies map keys in iteration order and singleton null/non-null state. Schema admission does not establish complete cross-record semantic validity, and sequential graph reads do not create an atomic filesystem snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Presence booleans cover singleton production and world records, while arrays cover keyed model, formation, shot and acceptance populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This inventory reports stored design existence, not successful compilation, reviewed completion or rendered delivery; absent records are not filled from stale output.
 * @evidence contracts/common.md#meaningful-documentation Defines each singleton presence flag and keyed design-id list for compact project status.
 * @author Samchon
 */
export interface IAutoMovieProductionDesignInventory {
  /** Whether the active production design exists. */
  production: boolean;

  /** Model recipe ids. */
  models: string[];

  /** Whether the project-shared world design exists. */
  world: boolean;

  /** Formation ids. */
  formations: string[];

  /** Shot contract ids. */
  shots: string[];

  /** Acceptance scenario ids. */
  acceptance: string[];
}
