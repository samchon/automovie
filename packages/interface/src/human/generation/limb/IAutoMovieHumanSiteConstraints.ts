import type { IAutoMovieViewSection } from "../../../construction/IAutoMovieViewSection";

/**
 * An invocation-owned tape solver over copied numeric section supports and site identity.
 *
 * The interface package owns these declarations; AutoMovieHumanSiteConstraints in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An invocation-owned tape solver over copied numeric section supports and site identity. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOwner declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOwner separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanSiteConstraints exchanges the named IOwner contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
    /**
     * Same tuple and diagnostic identity reuse the original result; changed inputs replace only that site's record.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same tuple and diagnostic identity reuse the original result; changed inputs replace only that site's record.
     */
    solve(
      name: string,
      extents: [number, number, number, number],
      girth: number,
    ): IAutoMovieViewSection.ISolved;
  }
}
