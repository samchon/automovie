/**
 * Locates the two contract owners one production's contracts come from: the
 * production itself and the shared skills tree.
 *
 * The production's own `work` and `language` contracts always live under
 * `<location>/docs/contracts`. The bundled shared contracts live under
 * `skills`, which a workspace points at its one shared tree; a standalone
 * production omits it and keeps them under its own `.agents/skills`.
 */
export interface IContractLocation {
  /**
   * Absolute production directory whose `docs/contracts` holds its `work` and
   * `language` contracts.
   */
  location: string;

  /**
   * Absolute directory of the shared `.agents/skills` tree holding the bundled
   * contracts.
   *
   * @default path.join(location, ".agents", "skills")
   */
  skills?: string;
}
