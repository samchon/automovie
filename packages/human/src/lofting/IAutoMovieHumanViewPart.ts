import type { AutoMovieHumanViewAxis } from "./AutoMovieHumanViewAxis";

/**
 * A part as its views draw it, the input of the view-to-section operator
 * (`AutoMovieHumanViewLoft`).
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
 * observations only (`AutoMovieHumanViewSection.ISection.diagonals`).
 */
export interface IAutoMovieHumanViewPart {
  /** Chain name of the lofted part, such as `trunk`, `leg.left` or `nose`. */
  name: string;

  /** The part's frame along its stations: straight in its bone frame, or moved by minimal rotation along a curved axis. */
  axis: AutoMovieHumanViewAxis.IAxis;

  /**
   * Stations of the emitted chain's layers in mm, strictly increasing. They
   * must include every outline and fullness knot's station, so each named site
   * is a layer and reads back exactly; between knots they stand as densely as
   * the surface needs.
   */
  stations: number[];

  /** The front view's two edges: chart coordinates of the section's extremes along `+u` and `-u`. */
  front: IAutoMovieHumanViewPart.IPair;

  /** The side view's two edges: chart coordinates of the section's extremes along `+v` and `-v`. */
  side: IAutoMovieHumanViewPart.IPair;

  /** What owns the quarters' fullness at each station. */
  fullness: IAutoMovieHumanViewPart.Fullness;

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

  /** Uniform phases of the chain's own rings, as `IAutoMovieHumanLoftChain.samples`. */
  samples: number;
}
export namespace IAutoMovieHumanViewPart {
  /** One knot of an outline or a law: a value at a named site's station. */
  export interface IKnot {
    /** The measurement site, such as `stylion` or `waist`, for diagnostics and identity tests. */
    site: string;

    /** Station of the site along the part's axis, mm. */
    station: number;

    /** The value at the site: a chart coordinate in mm, a girth in mm, or a shoulder share. */
    value: number;
  }

  /**
   * A curve in station through named knots: the natural cubic spline, C2,
   * of least bending through them, at least two knots by strictly increasing
   * station.
   */
  export interface IOutline {
    /** Knots by strictly increasing station. */
    knots: IKnot[];
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
   * (`AutoMovieHumanViewSection`): the share along a quarter's corner
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
