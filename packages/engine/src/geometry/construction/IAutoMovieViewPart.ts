import type {
  AutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionOutlineJet,
  IAutoMovieConstructionOutlineRange,
} from "@automovie/interface";

import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";

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
 *
 * @evidence contracts/common.md#principled-implementation A part is drawn by its front and side outlines about its own axis with a fullness owner, the inputs of conic lofting.
 * @evidence contracts/common.md#clear-and-simple-design One record of axis, stations, two outline pairs, fullness, pole, order and samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Departures need a published source or derivation and are never fitted to a reference.
 * @evidence contracts/common.md#meaningful-documentation States declared section planes, scalar source parameters, extremes/fullness ownership and the pole closure's premises rather than certifying emitted geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; lofting cost is on `AutoMovieViewLoft`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record without computed state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its knots are owned by its producer.
 */
export interface IAutoMovieViewPart {
  /** Chain name of the lofted part, such as `trunk`, `leg.left` or `nose`. */
  name: string;

  /** The declared section planes along authored stations, including straight, transported curved and fixed-basis parallel courses. */
  axis: AutoMovieViewAxis.IAxis;

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
   * quintic smoothstep over the nearest outline-knot span. These construction
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
   * Features written as heights over windows of the lofted chain's chart,
   * millimetres of station and radians of phase (`IAutoMovieLoftRelief`),
   * composed onto the chain the loft returns (its `reliefs`), so every reader
   * of that chain, the construction tree's realized face included, reads the
   * part with them. Absent means none: the chain is unchanged.
   */
  reliefs?: IAutoMovieLoftRelief[];
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
   *
   * @evidence contracts/common.md#principled-implementation Two signed coordinate sources own a section box's opposite extremes; non-pole sections require positive and negative edges on their respective sides of the axis.
   * @evidence contracts/common.md#clear-and-simple-design The same pair shape serves front and side views without encoding anatomical side names in the evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Outlines own their signed measurements; neither a side swap nor emitted geometry supplies replacement coordinates, and knot signs alone do not bound an interpolated source.
   * @evidence contracts/common.md#meaningful-documentation States sign, kernel millimetres and the interior-axis premise, with pole endpoints governed by the part's closure.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A two-source input record chooses no interpolation or admission algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair schedules no work; ViewLoft prepares each scalar source for its own reads.
   * @evidence contracts/performance.md#bound-retention-and-release-resources References two producer-owned outlines, whose knot counts determine storage; source admission makes its own preparations and no global cache belongs to the pair.
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
   *
   * @evidence contracts/common.md#principled-implementation A fixed four-tuple assigns a value to each cyclic guide interval, matching the section's ordered +u/+v/-u/-v chart.
   * @evidence contracts/common.md#clear-and-simple-design One generic tuple reuses that same quarter order for scalar shoulders, departures and source outlines.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not infer an anatomical side or validate a value; consumers must preserve the declared chart order.
   * @evidence contracts/common.md#meaningful-documentation Lists all four intervals and their wrap from the last guide to the first.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A tuple type has no runtime traversal or numerical algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The tuple schedules no computed work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds exactly four entries; transitive storage and lifetime remain those of T and its producer, not a constant-byte guarantee.
   */
  export type IQuarters<T> = [T, T, T, T];

  /**
   * Exactly one owner of quarter fullness: tape girth, one shoulder law with
   * optional departures, or four top-view shoulder laws.
   *
   * @evidence contracts/common.md#principled-implementation A closed discriminated union selects the scalar source of quarter fullness while the front and side sources keep owning the extremes.
   * @evidence contracts/common.md#clear-and-simple-design The kind field gives ViewLoft one exhaustive branch among the three existing ownership modes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No mode derives fullness from observed diagonals or final geometry; the type alone does not admit its numerical laws.
   * @evidence contracts/common.md#meaningful-documentation Names each alternative and separates fullness ownership from box-extreme ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A union describes input alternatives without running their evaluators or girth solve.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union creates no computation or shared result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The producer owns the selected variant's outlines; storage grows with their knots and no additional retained population belongs to the union.
   */
  export type Fullness = IGirth | IShoulder | ITop;

  /**
   * A tube's taut-tape girth per station: the perimeter of the section's
   * convex hull, solved into one shoulder value shared by the four quarters
   * (plus their declared departures).
   *
   * @evidence contracts/common.md#principled-implementation The authored tape value targets the convex-hull perimeter; ViewSection.solve adjusts one common shoulder with quarter departures, requiring a convex admitted section for curve length to represent that tape.
   * @evidence contracts/common.md#clear-and-simple-design One girth source and optional four departure sources keep the measured perimeter separate from its derived shoulder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tape definition is retained. Finite convexity checks do not certify the hull, ViewSection's root fallback does not certify the requested residual, and ViewLoft's later cap-shoulder adjustment can change the solved girth; these remain implementation gaps.
   * @evidence contracts/common.md#meaningful-documentation States the taut-tape meaning, millimetre girth, dimensionless shoulder departures and published-source requirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The input record chooses no solve; ViewSection owns the bounded shoulder search and curve-length integrations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record schedules no work; ViewLoft retains prepared scalar sources for its station loop.
   * @evidence contracts/performance.md#bound-retention-and-release-resources References one producer-owned girth outline and at most four departure outlines, with storage proportional to their knot populations and no record-owned cache.
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
   * diagonal from its chord to the box's corner. `sqrt(2) - 1` is the conic
   * ellipse reference for a centred symmetric box; it does not certify that
   * the shared-guide construction on every asymmetric box is an exact ellipse.
   *
   * @evidence contracts/common.md#principled-implementation One dimensionless shoulder source supplies the conic fullness law, with sourced quarter departures and independently owned box extremes.
   * @evidence contracts/common.md#clear-and-simple-design The shoulder discriminator distinguishes a directly authored law from girth's solved shoulder and top's four independent laws.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference is fitted here; the ellipse reference is not a proof of asymmetric conic fidelity, and section admission still belongs to ViewSection.
   * @evidence contracts/common.md#meaningful-documentation Defines rho's diagonal-share meaning, dimensionless units and the limited ellipse-reference claim.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A source record performs no section evaluation or root solve.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no work; ViewLoft prepares the source curves before evaluating stations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The producer owns the shoulder and optional departure outlines; their knot arrays determine retention, with no global table added by this type.
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
   * each quarter's shoulder value, carried by that outline's selected scalar
   * interpolation. The top outline's extremes are the front and side
   * outlines' values there; the outlines keep owning them.
   *
   * @evidence contracts/common.md#principled-implementation Four sourced shoulder curves own quarter fullness at each station while the same front and side curves continue to own section extremes.
   * @evidence contracts/common.md#clear-and-simple-design The top discriminator and one ordered four-tuple reuse the existing scalar outline evaluator for the third view.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Top laws do not replace the four extreme coordinates or reverse-engineer shoulders from emitted section observations.
   * @evidence contracts/common.md#meaningful-documentation Gives the third-view use, quarter source values and interpolation ownership without assuming every source is a natural cubic in station.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record runs no algorithm; source preparation and section evaluation belong to ViewLoft and ViewSection.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input schedules no work; each prepared quarter source is reused across the station loop.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds four producer-owned outline references whose knot counts set transitive storage; it starts no task and owns no cache.
   */
  export interface ITop {
    /** Discriminator. */
    kind: "top";

    /** Each quarter's shoulder value, knots at the top view's key stations. */
    shoulders: IQuarters<IOutline>;
  }
}
