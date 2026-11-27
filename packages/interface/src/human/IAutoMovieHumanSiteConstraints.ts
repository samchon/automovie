import type { IAutoMovieViewSection } from "../construction/IAutoMovieViewSection";

/**
 * An invocation-owned tape solver over copied numeric section supports and site
 * identity.
 *
 * The interface package owns these declarations; AutoMovieHumanSiteConstraints
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanSiteConstraints {
  /**
   * One explicit tape demand over copied numeric supports; no foreign callback
   * is retained.
   */
  export interface IOwner {
    /**
     * Same tuple and diagnostic identity reuse the original result; changed
     * inputs replace only that site's record.
     */
    solve(
      name: string,
      extents: [number, number, number, number],
      girth: number,
    ): IAutoMovieViewSection.ISolved;
  }
}
