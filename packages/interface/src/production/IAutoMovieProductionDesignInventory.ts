/** Compact inventory returned by project inspection. */
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
