/**
 * Authored operating state of a service device.
 *
 * @evidence contracts/common.md#principled-implementation A finite opening in the closed unit interval controls operating reachability, with exactly zero stopping traversal beyond the reached device when closedValvesBlock is requested.
 * @evidence contracts/common.md#clear-and-simple-design Human state name and numeric opening separate semantic labeling from the shared topological isolation rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current reachability only distinguishes zero from nonzero opening and does not solve proportional flow or pressure; closed state remains valid design topology.
 * @evidence contracts/common.md#meaningful-documentation Defines author-named state, opening range, exact-zero isolation and the quantitative-flow limitation.
 * @author Samchon
 */
export interface IAutoMovieServiceState {
  /** Author-named state such as `open`, `closed`, or `throttled`. */
  name: string;

  /**
   * Authored opening fraction in [0, 1]. Operating reach treats zero as isolating; partial opening does not currently calculate proportional capacity or physical flow.
   */
  opening: number;
}
