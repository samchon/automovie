import type { IAutoMovieConstructionOutlineJet } from "./IAutoMovieConstructionOutlineJet";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionOutlineRange } from "./IAutoMovieConstructionOutlineRange";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";

/**
 * Kernel input for building a part from its front and side outlines. The axis
 * places a section frame at each physical station in millimetres. Front edges
 * set signed u extremes, side edges set signed v extremes, and the chosen
 * fullness law gives the shape between their guides. The four guide phases
 * follow +u, +v, −u and −v.
 *
 * Read each source outline in its declared station, root or angle coordinate.
 * Direct shoulder and top sources retain their continuous scalar fields. Girth
 * publishes a section through the admitted coefficient representation. Derived
 * diagonals remain inspection observations.
 */
export interface IAutoMovieViewPart {
  /** Stable part and result-chain name used to identify source diagnostics. */
  name: string;

  /**
   * Section frame reader at physical stations in millimetres. Use its
   * world-millimetre origin and u and v axes to define the part's chart
   * orientation.
   */
  axis: IAutoMovieViewAxis.IAxis;

  /**
   * Strictly increasing principal stations in millimetres. Include every
   * retained extent and fullness knot for girth. Direct shoulder and top
   * sources can evaluate their knots between principal stations. A declared
   * closed tip remains an endpoint and carries no regular section.
   */
  stations: number[];

  /** Two front-view outlines giving signed u chart extremes in millimetres. */
  front: IAutoMovieViewPart.IPair;

  /** Two side-view outlines giving signed v chart extremes in millimetres. */
  side: IAutoMovieViewPart.IPair;

  /**
   * Owner of the shape between the four support guides, as girth, a common
   * shoulder or separate quarter controls.
   */
  fullness: IAutoMovieViewPart.Fullness;

  /**
   * Close the bottom, top or both endpoint stations in points. Omit it for two
   * open ends. At each cap tip the affected length outlines require an endpoint
   * knot within the source's zero tolerance. By default a single cap uses a
   * signed-root parameter and both caps use an angle parameter. An explicit map
   * must match the selected closing ends.
   *
   * ViewLoft adds rings at equal root-distance steps near the tip. Four-quarter
   * fullness approaches the ellipse share by a quintic cap weight. A top source
   * with touch or split geometry keeps its own angular and shoulder inputs; the
   * touch and split coordinates close with the length outlines.
   */
  pole?: "bottom" | "top" | "both";

  /**
   * Number of periodic cubic spline controls per coordinate. Use a multiple of
   * four at least eight to put every cardinal guide on a knot.
   */
  order: number;

  /** Positive count of ring vertices, independent of the section's spline order. */
  samples: number;

  /**
   * Optional ring phase samples in radians. Supply samples strictly increasing
   * entries within one turn from the first. Omit them for uniform phase
   * spacing.
   */
  phases?: number[];

  /**
   * Authored height features in the loft's station-millimetre and phase-radian
   * windows. The loft carries them into the chain's placement reads. Omit the
   * list for a bare part.
   */
  reliefs?: IAutoMovieLoftRelief[];
}

/** Data and callback contracts shared by the ViewPart operations. */
export namespace IAutoMovieViewPart {
  /**
   * One named scalar measurement at a physical station in millimetres. An
   * optional jet supplies its first and second derivatives in the whole
   * outline's normalized parameter.
   */
  export interface IKnot {
    /**
     * Measurement site label carried into outline diagnostics and source
     * inspection.
     */
    site: string;

    /** Physical station of this source knot in millimetres. */
    station: number;

    /**
     * Scalar value at the site in the outline's units, such as chart
     * millimetres, length in millimetres or a dimensionless share.
     */
    value: number;

    /**
     * Optional derivatives of the value with respect to the whole source span's
     * normalized parameter. The derivative values use the scalar's units.
     */
    jet?: IAutoMovieConstructionOutlineJet;
  }

  /**
   * Scalar outline through at least two named knots with increasing stations.
   * The default is a natural cubic in its interpolation coordinate. Authored
   * jets or a range request quintic interpolation. Outside the knot span,
   * permitted queries use the endpoint tangent. A pole parameter changes the
   * derivative coordinate.
   */
  export interface IOutline {
    /** At least two named scalar knots by increasing physical station. */
    knots: IAutoMovieViewPart.IKnot[];

    /**
     * Optional interpolation map with endpoint lengths in kernel millimetres.
     * Nonclosing outlines may use a nonzero value at a parameter endpoint.
     */
    parameter?: IAutoMovieConstructionOutlineParameter;

    /**
     * Optional scalar range in the outline's own units. The quintic preparation
     * checks a sufficient control hull on the closed knot span.
     */
    range?: IAutoMovieConstructionOutlineRange;
  }

  /**
   * Signed view outlines on two sides of one chart axis. At a regular section
   * station use positive and negative coordinates whose interval strictly
   * contains the axis. Each outline follows the selected closure at a cap.
   */
  export interface IPair {
    /** Outline of the positive chart extreme in millimetres. */
    positive: IAutoMovieViewPart.IOutline;

    /**
     * Outline of the negative chart extreme in millimetres. The directional
     * half-extent is its negation.
     */
    negative: IAutoMovieViewPart.IOutline;
  }

  /**
   * Four values in cyclic phase order. Quarter zero starts at +u, then the
   * starts are +v, −u and −v. Each quarter ends at the following guide.
   */
  export type IQuarters<T> = [T, T, T, T];

  /**
   * Choose one source of quarter fullness for the entire part. Girth solves one
   * common share from a measured length. Shoulder supplies the common share
   * directly. Top supplies each quarter and any contact or split geometry
   * explicitly.
   */
  export type Fullness =
    | IAutoMovieViewPart.IGirth
    | IAutoMovieViewPart.IShoulder
    | IAutoMovieViewPart.ITop;

  /**
   * Measured taut-tape girth along the part, in millimetres. The solver selects
   * a common shoulder for the requested numerical perimeter and adds the
   * authored quarter departures. The result may retain a reach endpoint and a
   * diagnostic.
   */
  export interface IGirth {
    /** Select measured-girth fullness. */
    kind: "girth";

    /**
     * Taut-tape length outline in millimetres at the authored measurement
     * sites.
     */
    girth: IAutoMovieViewPart.IOutline;

    /**
     * Optional dimensionless quarter offsets added to the common solved
     * shoulder, in cyclic order. Omission uses four zeros. Supply departures
     * from authored observations or an explicit derivation.
     */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
  }

  /**
   * Original common conic shoulder share across stations. The share controls
   * the corner diagonal between the quarter's chord and box corner. Add
   * optional authored departures to get the four section shares. The ellipse
   * reference share is √2 − 1.
   */
  export interface IShoulder {
    /** Select one sourced common shoulder law. */
    kind: "shoulder";

    /**
     * Dimensionless common shoulder outline read at the physical station before
     * quarter departures.
     */
    shoulder: IAutoMovieViewPart.IOutline;

    /**
     * Optional per-quarter dimensionless offsets from the common shoulder, in
     * cyclic order.
     */
    departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
  }

  /**
   * Four separate shoulder outlines from the top view, with optional contact
   * offsets and splits. The front and side views retain the four support
   * extremes. Declare either a single split per quarter or ordered split
   * lists.
   */
  export interface ITop {
    /** Select top-view quarter fullness and its contact controls. */
    kind: "top";

    /**
     * Dimensionless shoulder outline of each quarter, or of its first piece
     * when that quarter is split.
     */
    shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /**
     * Optional guide contact offsets in chart millimetres. At the ±u supports
     * they give v, and at the ±v supports they give u. Omission puts each
     * contact on its chart axis.
     */
    touch?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

    /**
     * Optional single split point with tangent and following shoulder per
     * quarter. The first piece uses the guide's shoulder. Use this form when
     * pieces is absent.
     */
    splits?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit>;

    /**
     * Optional ordered split points within each quarter. The guide supplies the
     * first shoulder and each split supplies the following piece's shoulder. An
     * empty list leaves one piece. Use this form when splits is absent.
     */
    pieces?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.ISplit[]>;
  }

  /**
   * One interior conic split supplied by four outlines across stations. The u
   * and v coordinates give the local point, angle sets its forward tangent and
   * shoulder controls the piece that leaves the point.
   */
  export interface ISplit {
    /** Split point's u coordinate in chart millimetres. */
    u: IAutoMovieViewPart.IOutline;

    /** Split point's v coordinate in chart millimetres. */
    v: IAutoMovieViewPart.IOutline;

    /**
     * Forward tangent angle in radians from +u toward +v, oriented in
     * increasing polar phase.
     */
    angle: IAutoMovieViewPart.IOutline;

    /**
     * Dimensionless shoulder share in (0, 1) for the piece starting at this
     * split.
     */
    shoulder: IAutoMovieViewPart.IOutline;
  }
}
