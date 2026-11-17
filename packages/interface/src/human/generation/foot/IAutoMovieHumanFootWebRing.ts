/** Type contracts exchanged by AutoMovieHumanFootWebRing; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootWebRing {
  /** Each toe's arcs of the ring.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each toe's arcs of the ring.
   * @evidence contracts/development/design.md#principled-representation `arcs`: Each toe's arcs of the body's ring, left phases, hallux first.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootWebRing.of. Also types AutoMovieHumanFootConstruction.web.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `arcs`; callers supply the complete record.
   */
  export interface IWebRing {
    /** Each toe's arcs of the body's ring, left phases, hallux first. */
    arcs: [number, number][][];
  }
}
