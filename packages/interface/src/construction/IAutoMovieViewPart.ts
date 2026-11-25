import type { IAutoMovieConstructionOutlineJet } from "./IAutoMovieConstructionOutlineJet";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionOutlineRange } from "./IAutoMovieConstructionOutlineRange";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";
import type { IAutoMovieLoftSectionConnect } from "./IAutoMovieLoftSectionConnect";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";

/**
 * A part as its views draw it, the input of the view-to-section operator
 * (`AutoMovieViewLoft`).
 *
 * At each station the declared axis supplies the section's origin and plane,
 * in the chart `(x, z)` of that plane's axes `(u, v)`. The axis may follow a
 * straight or curved course, or move fixed parallel planes; those planes
 * need not be perpendicular to the origin's course. The front view
 * sees the part along `v`, so its two edges are the section's extremes along
 * `u`; the side view sees it along `u`, so its two edges are the extremes
 * along `v`. At each station those four edges make a box about the axis, the
 * section touches the box once on each side at the guide angles 0, `pi / 2`,
 * `pi` and `3 pi / 2` (the `+u`, `+v`, `-u` and `-v` directions), and the
 * fullness of the four quarters between the guides is owned by the girth or by
 * a sourced fullness law (`fullness`).
 *
 * Each outline interpolates named source knots in its declared station,
 * root or angle parameter: natural cubics by default, or explicitly requested
 * shared-jet/range quintics. Smoothness in that parameter does not promise a
 * finite station jet at a singular pole. Each knot's value remains the input
 * at its published site. Which anatomical edge is `+u` (lateral
 * or medial, left or right) is the part's own declaration through its axis.
 *
 * Ownership (fairing by ownership): the outlines own the extremes, the girth
 * or the fullness law owns the quarters' fullness, and the diagonals are
 * observations only (`AutoMovieViewSection.ISection.diagonals`).
 */
export interface IAutoMovieViewPart {
  /** Chain name of the lofted part, such as `trunk`, `leg.left` or `nose`. */
  name: string;

  /** The declared section planes along authored stations, including straight, transported curved and fixed-basis parallel courses. */
  axis: IAutoMovieViewAxis.IAxis;

  /**
   * Stations of the emitted chain's layers in mm, strictly increasing. They
   * For a direct shoulder/top source, its continuous functions own every knot
   * even without a layer there. Generic girth's coefficient representation
   * requires each retained contour/fullness knot as a declared station.
   * Controls outside that interval
   * may remain to preserve the original scalar function and explicit parameter;
   * they emit no layer. Between sites, stations follow the surface's needs.
   * Generic girth checks all those declared knots regardless of site label;
   * internal interpolation and axis-source knots require no extra layers.
   */
  stations: number[];

  /** The front view's two edges: chart coordinates of the section's extremes along `+u` and `-u`. */
  front: IAutoMovieViewPart.IPair;

  /** The side view's two edges: chart coordinates of the section's extremes along `+v` and `-v`. */
  side: IAutoMovieViewPart.IPair;

  /** What owns the quarters' fullness at each station. */
  fullness: IAutoMovieViewPart.Fullness;

  /** Optional immutable bounded prefix or complete original uncapped regular section field. */
  originalSection?: IAutoMovieLoftSectionConnect.IOriginal;

  /**
   * The end that closes in a point, or both ends (`both`: a foot from the
   * heel to its forefoot cap; a fingertip, a toe tip, the heel, the
   * perineum's cap), where all four outlines and the girth have a knot of
   * value 0 at that end's station. The chain then carries that point as its
   * `pole`. Radial source preparation uses a signed square-root parameter
   * for one pole and an angle parameter for two by default. An explicit original
   * parameter must have the same singular endpoint and inward side at every
   * actual pole; its other endpoint may lie outside the retained interval.
   * Parameter endpoints alone declare no cap. Preserving an old native field
   * requires the removed cap's actual effects to vanish on the kept interval.
   * The loft adds rings at equal steps of the root of
   * pole distance and moves shoulders toward the conic ellipse value by a
   * quintic smoothstep over the nearest outline-knot span. A top fullness
   * with touch offsets or splits keeps its own angles and shoulders instead:
   * its touch offsets and split coordinates also have a knot of value 0 at
   * the pole, and the cap is the end section shrunk to that point. These construction
   * choices require regular compatible source/frame jets for a smooth dome;
   * this field does not prove G2 regularity of the resulting pole. Absent,
   * both ends are open sections.
   */
  pole?: "bottom" | "top" | "both";

  /** Control points of every section's periodic cubic B-spline, a positive multiple of 4 so each guide stands on a knot. */
  order: number;

  /** Uniform phases of the chain's own rings, as `IAutoMovieLoftChain.samples`. */
  samples: number;

  /**
   * The chain's own ring phases when they are not uniform (`IAutoMovieLoftChain.phases`): radians, strictly increasing within one turn
   * from the first, `samples` of them. Absent, uniform.
   */
  phases?: number[];

  /**
   * Features written as heights over windows of the lofted chain's chart,
   * millimetres of station and radians of phase (`IAutoMovieLoftRelief`),
   * composed onto the chain the loft returns (its `reliefs`), so every reader
   * of that chain, the construction tree's realized face included, reads the
   * part with them. Absent means none: the chain is unchanged.
   */
  reliefs?: IAutoMovieLoftRelief[];

  /** Exact bounded weight fields over the same original part. */
  originalGraphs?: IAutoMovieLoftRelief.IGraph[];
}

/** Data and callback contracts shared by the ViewPart operations. */
export namespace IAutoMovieViewPart {
  /**
   * One named source value, with optional first/second derivatives in the whole source's normalized interpolation parameter.
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
   */
  export interface IOutline {
    /** Knots by strictly increasing station. */
    knots: IAutoMovieViewPart.IKnot[];

    /** Optional source parameter, with endpoint station lengths in kernel millimetres; choosing it does not impose a zero scalar value. */
    parameter?: IAutoMovieConstructionOutlineParameter;

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
    positive: IAutoMovieViewPart.IOutline;

    /** The edge on the negative side of the axis, mm, below zero. */
    negative: IAutoMovieViewPart.IOutline;
  }

  /**
   * Four values, one per quarter of the section, by increasing angle:
   * quarter `q` runs from guide `q` to guide `q + 1`, so quarter 0 lies
   * between `+u` and `+v`, 1 between `+v` and `-u`, 2 between `-u` and `-v`,
   * 3 between `-v` and `+u`.
   */
  export type IQuarters<T> = [T, T, T, T];

  /**
   * Exactly one owner of quarter fullness: tape girth, one shoulder law with
   * optional departures, or four top-view shoulder laws.
   */
  export type Fullness =
    | IAutoMovieViewPart.IGirth
    | IAutoMovieViewPart.IShoulder
    | IAutoMovieViewPart.ITop;

  /**
   * A tube's taut-tape girth per station: the perimeter of the section's
   * convex hull, solved into one shoulder value shared by the four quarters
   * (plus their declared departures).
   */
  export interface IGirth {
    /** Discriminator. */
    kind: "girth";

    /** The girth, mm, knots at the published tape sites. */
    girth: IAutoMovieViewPart.IOutline;

    /**
     * Sourced departures of each quarter's shoulder from the solved one, in
     * shoulder share; absent means none. Each needs a published source or a
     * derivation; a departure is never fitted to a reference.
     */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
  }

  /**
   * A sourced fullness law per station, as the conic shoulder value `rho`
   * (`AutoMovieViewSection`): the share along a quarter's corner
   * diagonal from its chord to the box's corner. `sqrt(2) - 1` is the conic
   * ellipse reference for a centred symmetric box; it does not certify that
   * the shared-guide construction on every asymmetric box is an exact ellipse.
   */
  export interface IShoulder {
    /** Discriminator. */
    kind: "shoulder";

    /** The shoulder value per station. */
    shoulder: IAutoMovieViewPart.IOutline;

    /** Sourced departures of each quarter's shoulder, as for {@link IGirth}. */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
  }

  /**
   * A part whose third view is the top (the nose's base, the sole, the lips'
   * arch): the top outline gives the section's shape at its key stations as
   * each quarter's shoulder value, carried by that outline's selected scalar
   * interpolation. The top outline's extremes are the front and side
   * outlines' values there; the outlines keep owning them.
   */
  export interface ITop {
    /** Discriminator. */
    kind: "top";

    /** Each quarter's shoulder value, knots at the top view's key stations; with {@link splits}, the shoulder of the quarter's first piece. */
    shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /**
     * Where each guide touches its support line, millimetres along it from
     * the chart axis: the `v` of the `+u` and `-u` extremes and the `u` of
     * the `+v` and `-v` extremes, so a section's extreme point stands where
     * the section actually reaches it (classic conic lofting's maximum
     * half-breadth line has its own height). Absent: every guide on its axis
     * line, the four-quarter section's convention.
     */
    touch?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /**
     * Each quarter split into two conic pieces at a point of the section
     * (#3158): quarter q runs from guide q to split q with shoulder
     * `shoulders[q]` and from split q to guide q + 1 with
     * `splits[q].shoulder`, each piece a rational quadratic on its two end
     * points and tangent lines (`AutoMovieViewChain`). Absent: one conic per
     * quarter.
     */
    splits?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit>;

    /**
     * Each quarter split into conic pieces at its ordered points of the
     * section (#3158), in increasing phase: quarter q runs from guide q
     * through `pieces[q][0]`, `pieces[q][1]`, ... to guide q + 1, its first
     * piece with shoulder `shoulders[q]` and each later piece with the
     * shoulder of the point that starts it, each a rational quadratic on its
     * two end points and tangent lines (`AutoMovieViewChain`). An empty list
     * leaves the quarter one conic. Absent: one conic per quarter.
     */
    pieces?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit[]>;
  }

  /**
   * One quarter's split point, its tangent and the shoulder of the piece
   * that starts there, each supplied as an outline in station.
   */
  export interface ISplit {
    /** The split point's `u`, chart millimetres. */
    u: IAutoMovieViewPart.IOutline;

    /** The split point's `v`, chart millimetres. */
    v: IAutoMovieViewPart.IOutline;

    /** The tangent direction there, radians from `+u` toward `+v`, oriented in increasing phase. */
    angle: IAutoMovieViewPart.IOutline;

    /** The shoulder of the piece starting at this split, in (0, 1). */
    shoulder: IAutoMovieViewPart.IOutline;
  }
}
