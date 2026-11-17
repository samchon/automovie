/**
 * Brow tape search modes, sagittal ear attachments and dimensionless continuation coordinates.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadTapeBrow in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Brow tape search modes, sagittal ear attachments and dimensionless continuation coordinates. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only Mode, P2, MaximumSeed declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation Mode, P2, MaximumSeed separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadTapeBrow exchanges the named Mode, P2, MaximumSeed contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadTapeBrow {
  /**
   * How the posterior anchor is searched.
   *
   * `complete` scans every original source station and knot midpoint of the
   * ownership interval and refines each observed local maximum: the search's
   * definition of the maximizing course. `continued` refines only the local
   * maximum next to a seed from a neighbouring member of the same source family,
   * and falls back to `complete` whenever the seed is not a local maximum of its
   * two neighbouring scan sites. A continued result is therefore a local
   * maximum; `AutoMovieHumanHeadTape.close` certifies its final member with
   * `complete` before publishing it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation How the posterior anchor is searched.
   * @evidence contracts/development/design.md#principled-representation How the posterior anchor is searched. The closed alternatives are "complete", "continued".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum for how the posterior anchor is searched.
   */
  export type Mode = "complete" | "continued";

  /** Actual unchanged ear attachment in the sagittal calibration-mm chart.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual unchanged ear attachment in the sagittal calibration-mm chart.
   * @evidence contracts/development/design.md#principled-representation Actual unchanged ear attachment in the sagittal calibration-mm chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTapeBrow.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeBrow.evaluate for actual unchanged ear attachment in the sagittal calibration-mm chart.
   */
  export type P2 = readonly [number, number];

  /**
   * Continuation coordinates from an earlier brow-course result. The first slot
   * is the course's anterior coordinate, published as zero by the fixed-brow
   * search; the posterior search reads only the second slot. That slot is the
   * dimensionless share `(back - first) / (brow - first)` of the current
   * ownership interval and must map to a finite station inside that interval.
   * A seed does not certify a maximum: the selected search mode controls the
   * neighbouring-site check and complete-search fallback.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines both coordinate slots, the posterior share's current-interval interpretation and the seed's lack of a maximum guarantee.
   * @evidence contracts/development/design.md#principled-representation A readonly two-number tuple accepts the coordinates of an existing course. AutoMovieHumanHeadTapeBrow.maximum validates the mapped posterior station; numeric finiteness and interval membership are not enforced by the tuple.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadTape passes a previous course's coordinates into AutoMovieHumanHeadTapeBrow.maximum; retaining both slots preserves that result-to-input exchange.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The first coordinate is retained because callers pass the full course coordinates, while the fixed-brow search uses only the posterior coordinate. No convergence or residual claim is encoded in the tuple.
   */
  export type MaximumSeed = readonly [number, number];
}
