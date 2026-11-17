import type { IAutoMovieViewSection } from "../../../construction/IAutoMovieViewSection";

/** Type contracts exchanged by AutoMovieHumanSiteConstraints; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSiteConstraints {
  /** One explicit tape demand over copied numeric supports; no foreign callback is retained.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One explicit tape demand over copied numeric supports; no foreign callback is retained.
   * @evidence contracts/development/design.md#principled-representation One explicit tape demand over copied numeric supports; no foreign callback is retained.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSiteConstraints.create. Read by AutoMovieHumanSiteControls.prepare. Also types AutoMovieHumanSiteControls.solve, AutoMovieHumanSiteRegionControls.constraints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSiteConstraints.create, AutoMovieHumanSiteControls.prepare, AutoMovieHumanSiteControls.solve, AutoMovieHumanSiteRegionControls.constraints for one explicit tape demand over copied numeric supports; no foreign callback is retained.
   */
  export interface IOwner {
    /** Same tuple and diagnostic identity reuse the original result; changed inputs replace only that site's record. */
    solve(
      name: string,
      extents: [number, number, number, number],
      girth: number,
    ): IAutoMovieViewSection.ISolved;
  }
}
