/**
 * A join's seed found on the built surfaces: where the part face's station line at one phase crosses the host face, searched between two shares of the part face's station range.
 *
 * A part's stations exist only once it is lofted, so an author states where to look rather than a chart point. The engine walks the station line at `phase` from share `from` to share `to`, one step per span between the part chain's consecutive stations, takes each step's foot on the host face and solves the meeting by Newton's method from it; the first meeting whose station lies between the shares is the seed. A line that meets the host nowhere between the shares is one diagnostic and the join is left out.
 *
 * Engine admission: `from` and `to` inside `[0, 1]` and different; `phases`, when given, a positive integer.
 *
 * @evidence contracts/development/design.md#principled-representation The crossing of one curve of the part with the host is a three-equation meeting in the station and the host's chart, solved by Newton from each step's foot, so the seed is a point of the true curve whatever the part's lofted stations turn out to be.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two face names, one phase, an optional count of lines round the part and two shares are the whole search; the walk's direction is the order of the shares, the lines' order is the phase's then increasing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The search runs along a finite, declared set of station lines, never over the whole surface or a tessellation; no meeting on any of them is reported.
 * @evidence contracts/development/common.md#meaningful-documentation States why the seed is searched, the walk, the solve, the failure effect and the admission.
 */
export interface IAutoMovieConstructionSearchSeed {
  /** Discriminator. */
  type: "search";

  /** The face of the part that meets the host: a view part's name in the part's subtree. */
  partFace: string;

  /** The host face to meet: a view part's or a join's name in the host's subtree. */
  hostFace: string;

  /** The part face's phase whose station line is searched, radians. */
  phase: number;

  /**
   * How many station lines round the part face the search may walk, a positive integer; absent, 1. With `n` lines the engine walks the
   * line at `phase`, then those at `phase + 2 pi k / n` for `k = 1 .. n - 1` in that order, each between the same shares, and the first
   * line with an admitted meeting gives the seed and its phase (ties go to the earlier line).
   *
   * Which line of a part meets its host is a property of both surfaces, not of the part alone: a ridge whose ends are buried in its host
   * meets it along a flank, while a tube whose end lies in another face meets it on the side facing the host (f1's helix, whose line at
   * phase 0 stays outside the ear's plate over the whole search while its opposite line crosses it twice). A fixed phase holds for one
   * person's geometry; a window of lines lets the search find the crossing on both.
   */
  phases?: number;

  /** The share of the part face's station range the search starts at, inside `[0, 1]`. */
  from: number;

  /** The share it ends at, inside `[0, 1]`. */
  to: number;
}
