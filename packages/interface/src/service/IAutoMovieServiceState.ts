/**
 * Authored operating state of a service device.
 *
 * @evidence contracts/development/design.md#principled-representation A finite opening in the closed unit interval controls operating reachability, with exactly zero stopping traversal beyond the reached device when closedValvesBlock is requested.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Human state name and numeric opening separate semantic labeling from the shared topological isolation rule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Current reachability only distinguishes zero from nonzero opening and does not solve proportional flow or pressure; closed state remains valid design topology.
 * @evidence contracts/development/common.md#meaningful-documentation Defines author-named state, opening range, exact-zero isolation and the quantitative-flow limitation.
 */
export interface IAutoMovieServiceState {
  /** Author-named state such as `open`, `closed`, or `throttled`. */
  name: string;

  /**
   * Authored opening fraction in [0, 1]. Operating reach treats zero as isolating; partial opening does not currently calculate proportional capacity or physical flow.
   */
  opening: number;
}
