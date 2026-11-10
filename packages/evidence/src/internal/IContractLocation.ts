/**
 * Locates the two contract owners one production's contracts come from: the production itself and the shared skills tree.
 *
 * The production's own `work` and `language` contracts always live under
 * `<location>/docs/contracts`. The bundled shared contracts live under
 * `skills`, which a workspace points at its one shared tree; a standalone
 * production omits it and keeps them under its own `.agents/skills`.
 *
 * @evidence contracts/development/design.md#principled-representation Two absolute directories represent the two owners a contract can have, the production and the shared bundle; the optional member encodes the standalone layout, where the shared bundle sits under the production's own `.agents/skills`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two directories that decide where a contract resolves; route, stages and claims stay with the configuration types that carry this shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No flag says "workspace": the owner is the directory itself, and an omitted `skills` is the standalone default rather than a guessed location.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states which families each directory owns and the omitted default; the members state they are absolute.
 */
export interface IContractLocation {
  /** Absolute production directory whose `docs/contracts` holds its `work` and `language` contracts. */
  location: string;

  /**
   * Absolute directory of the shared `.agents/skills` tree holding the bundled
   * contracts.
   *
   * @default path.join(location, ".agents", "skills")
   */
  skills?: string;
}
