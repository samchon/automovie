import type { AutoMovieConstructionOutlineParameter, IAutoMovieConstructionOutlineJet, IAutoMovieConstructionOutlineRange } from "@automovie/interface";

import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";

/**
 * A part as its views draw it, the input of the view-to-section operator
 * (`AutoMovieViewLoft`).
 *
 * A part is lofted straight in its own frame: its stations run along its axis
 * (`axis`), and every section lies in the plane square to the axis at its
 * station, in the chart `(x, z)` of that plane's axes `(u, v)`. The front view
 * sees the part along `v`, so its two edges are the section's extremes along
 * `u`; the side view sees it along `u`, so its two edges are the extremes
 * along `v`. At each station those four edges make a box about the axis, the
 * section touches the box once on each side at the guide angles 0, `pi / 2`,
 * `pi` and `3 pi / 2` (the `+u`, `+v`, `-u` and `-v` directions), and the
 * fullness of the four quarters between the guides is owned by the girth or by
 * a sourced fullness law (`fullness`).
 *
 * Every outline is a natural cubic spline in station through knots at named
 * measurement sites, so the outline is C2 in station and each knot's value is
 * an input read at its published site. Which anatomical edge is `+u` (lateral
 * or medial, left or right) is the part's own declaration through its axis.
 *
 * Ownership (fairing by ownership): the outlines own the extremes, the girth
 * or the fullness law owns the quarters' fullness, and the diagonals are
 * observations only (`AutoMovieViewSection.ISection.diagonals`).
 *
 * @evidence contracts/common.md#principled-implementation A part is drawn by its front and side outlines about its own axis with a fullness owner, the inputs of conic lofting.
 * @evidence contracts/common.md#clear-and-simple-design One record of axis, stations, two outline pairs, fullness, pole, order and samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Departures need a published source or derivation and are never fitted to a reference.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the views, the ownership of extremes and fullness, and the pole's dome.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; lofting cost is on `AutoMovieViewLoft`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record without computed state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its knots are owned by its producer.
 */
export interface IAutoMovieViewPart {
  /** Chain name of the lofted part, such as `trunk`, `leg.left` or `nose`. */
  name: string;

  /** The part's frame along its stations: straight in its bone frame, or moved by minimal rotation along a curved axis. */
  axis: AutoMovieViewAxis.IAxis;

  /**
   * Stations of the emitted chain's layers in mm, strictly increasing. They
   * must include every outline and fullness knot's station, so each named site
   * is a layer and reads back exactly; between knots they stand as densely as
   * the surface needs.
   */
  stations: number[];

  /** The front view's two edges: chart coordinates of the section's extremes along `+u` and `-u`. */
  front: IAutoMovieViewPart.IPair;

  /** The side view's two edges: chart coordinates of the section's extremes along `+v` and `-v`. */
  side: IAutoMovieViewPart.IPair;

  /** What owns the quarters' fullness at each station. */
  fullness: IAutoMovieViewPart.Fullness;

  /**
   * The end that closes in a point, or both ends (`both`: a foot from the
   * heel to its forefoot cap; a fingertip, a toe tip, the heel, the
   * perineum's cap), where all four outlines and the girth have a knot of
   * value 0 at that end's station. The chain then carries that point as its
   * `pole`, closed as a G2 dome: toward the pole every outline and the girth
   * run as natural splines in `sigma = sqrt(|s - s_pole|)`, so each meets the
   * axis square to it with no second-order term in `sigma` (the natural end
   * condition), which makes the profile's square smooth in the distance, the
   * form of a smooth cap; the shoulders reach the ellipse's at the pole by a
   * quintic smoothstep over the span to the nearest other outline knot, and
   * rings are added at equal steps of `sigma` between the nearest given
   * station and the pole. Absent, both ends are open sections.
   */
  pole?: "bottom" | "top" | "both";

  /** Control points of every section's periodic cubic B-spline, a positive multiple of 4 so each guide stands on a knot. */
  order: number;

  /** Uniform phases of the chain's own rings, as `IAutoMovieLoftChain.samples`. */
  samples: number;
}
export namespace IAutoMovieViewPart {
  /**
   * One named source value, with optional first/second derivatives in the whole source's normalized interpolation parameter.
   *
   * @evidence contracts/common.md#principled-implementation Site/station/value remain source identities; explicit normalized jets supply shared knot tangency and curvature without observing an emitted section.
   * @evidence contracts/common.md#clear-and-simple-design Three required measurement fields and one optional two-component jet serve all scalar owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither site spelling nor mesh output determines a jet; null starts from the natural value and only a separately requested wholly-unauthored range filter may change it.
   * @evidence contracts/common.md#meaningful-documentation States millimetre station and scalar/normalized-jet units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input record has no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input schedules no computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns the input; source admission copies it.
   */
  export interface IKnot {
    /** The measurement site, such as `stylion` or `waist`, for diagnostics and identity tests. */
    site: string;

    /** Station of the site along the part's axis, mm. */
    station: number;

    /** The value at the site: a chart coordinate in mm, a girth in mm, or a shoulder share. */
    value: number;

    /** Optional first/second derivatives in the whole outline's normalized source parameter, with the value's units. */
    jet?: IAutoMovieConstructionOutlineJet;
  }

  /**
   * A scalar source through at least two named knots in increasing station: the default natural cubic, or explicitly requested shared-jet/range quintics, C2 within the closed source span in its selected parameter. Radial closure selects its pole parameter by default; a nonclosing coordinate parameter imposes no zero value. Tangent extension of an authored nonzero end curvature is only C1.
   *
   * @evidence contracts/common.md#principled-implementation Natural interpolation remains the default; explicit shared first/second jets or a sufficient scalar control-hull bound select C2 quintics in the same source parameter. Radial closure is separate.
   * @evidence contracts/common.md#clear-and-simple-design A knot list and optional source parameter serve the same scalar evaluator for outlines and origins.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A world parameter endpoint does not invent a radial zero or station-finite derivative.
   * @evidence contracts/common.md#meaningful-documentation States source parameter, kernel endpoint units and closure separation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Source data has no runtime algorithm; ViewOutline prepares it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source data coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns its source knots; the evaluator copies them.
   */
  export interface IOutline {
    /** Knots by strictly increasing station. */
    knots: IKnot[];

    /** Optional source parameter, with endpoint station lengths in kernel millimetres; choosing it does not impose a zero scalar value. */
    parameter?: AutoMovieConstructionOutlineParameter;

    /** Optional sufficient control-hull bound on the closed scalar knot span, in the value's units; no world-frame or extension bound is implied. */
    range?: IAutoMovieConstructionOutlineRange;
  }

  /**
   * One view's two edges as signed chart coordinates: `positive` is the
   * coordinate of the extreme on the axis's positive side (above zero),
   * `negative` of the extreme on its negative side (below zero). A box that
   * does not hold its axis strictly inside cannot be a polar section about
   * it, and is reported.
   */
  export interface IPair {
    /** The edge on the positive side of the axis, mm, above zero. */
    positive: IOutline;

    /** The edge on the negative side of the axis, mm, below zero. */
    negative: IOutline;
  }

  /**
   * Four values, one per quarter of the section, by increasing angle:
   * quarter `q` runs from guide `q` to guide `q + 1`, so quarter 0 lies
   * between `+u` and `+v`, 1 between `+v` and `-u`, 2 between `-u` and `-v`,
   * 3 between `-v` and `+u`.
   */
  export type IQuarters<T> = [T, T, T, T];

  /** What owns the quarters' fullness. */
  export type Fullness = IGirth | IShoulder | ITop;

  /**
   * A tube's taut-tape girth per station: the perimeter of the section's
   * convex hull, solved into one shoulder value shared by the four quarters
   * (plus their declared departures).
   */
  export interface IGirth {
    /** Discriminator. */
    kind: "girth";

    /** The girth, mm, knots at the published tape sites. */
    girth: IOutline;

    /**
     * Sourced departures of each quarter's shoulder from the solved one, in
     * shoulder share; absent means none. Each needs a published source or a
     * derivation; a departure is never fitted to a reference.
     */
    departures?: IQuarters<IOutline>;
  }

  /**
   * A sourced fullness law per station, as the conic shoulder value `rho`
   * (`AutoMovieViewSection`): the share along a quarter's corner
   * diagonal from its chord to the box's corner, `sqrt(2) - 1` the ellipse.
   */
  export interface IShoulder {
    /** Discriminator. */
    kind: "shoulder";

    /** The shoulder value per station. */
    shoulder: IOutline;

    /** Sourced departures of each quarter's shoulder, as for {@link IGirth}. */
    departures?: IQuarters<IOutline>;
  }

  /**
   * A part whose third view is the top (the nose's base, the sole, the lips'
   * arch): the top outline gives the section's shape at its key stations as
   * each quarter's shoulder value, carried between them by the natural
   * spline per quarter. The top outline's extremes are the front and side
   * outlines' values there; the outlines keep owning them.
   */
  export interface ITop {
    /** Discriminator. */
    kind: "top";

    /** Each quarter's shoulder value, knots at the top view's key stations. */
    shoulders: IQuarters<IOutline>;
  }
}
