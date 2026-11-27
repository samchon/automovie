import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Segment transforms, sourced datums, curve constraints and source-parameter
 * outline jets. Runtime construction and admission remain with
 * AutoMovieHumanArmCurveSpec in Human.
 */
export namespace IAutoMovieHumanArmCurveSpec {
  /**
   * Rigid transform of a child frame into its parent: a child point `p` lies at
   * `origin + axes[0] * p[0] + axes[1] * p[1] + axes[2] * p[2]` in the parent.
   * `axes` are orthonormal and right-handed.
   */
  export interface ITransform {
    /** Child origin in parent coordinates. */
    origin: AutoMovieVector3Tuple;

    /** Child X, Y and Z axes in parent coordinates. */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
  }

  /** Where a datum's value comes from. */
  export type ISource =
    | {
        /** A field of the public input. */
        kind: "input";
        /**
         * Public input field supplying this datum; its measurement protocol
         * remains the field's own.
         */
        field: string;
      }
    | {
        /** A published relation or definition. */
        kind: "published";
        /** Publication identifying the measurement or geometric rule. */
        citation: string;
        /** The cited observation needed to reconstruct this datum. */
        detail: string;
      }
    | {
        /** A construction derived from other datums. */
        kind: "derived";
        /** Construction rule that derives this datum from the stated inputs. */
        rule: string;
      }
    | {
        /** Unsourced value kept visibly as debt. */
        kind: "debt";
        /**
         * Why this declared construction is needed when no measured datum is
         * available.
         */
        reason: string;
      };

  /** One ISB-style segment frame, relative to its parent frame. */
  export interface ISegmentFrame {
    /** Frame name, e.g. `humerus.left`. */
    name: string;

    /** Parent frame name; `null` for the root that receives a trunk transform. */
    parent: string | null;

    /** Origin datum and axis definition, with citation. */
    basis: ISource;

    /** Placement in the parent frame. */
    relative: ITransform;
  }

  /** A named point expressed in one frame. */
  export interface IDatum {
    /** Datum name. */
    name: string;

    /** Frame the coordinates are expressed in. */
    frame: string;

    /** Local coordinates, calibration mm. */
    point: AutoMovieVector3Tuple;

    /** Basis of the value. */
    source: ISource;
  }

  /**
   * A constraint the constructed curve must satisfy, checked independently of
   * the constructor.
   */
  export type IConstraint =
    | {
        /** The curve passes through the datum. */
        kind: "pass";
        /** Name of the previously declared datum that constrains this curve. */
        datum: string;
      }
    | {
        /**
         * The closed curve lies in the plane through `origin` with unit
         * `normal`.
         */
        kind: "planar";
        /**
         * Point on the constraint plane in the curve's declared frame,
         * millimetres.
         */
        origin: AutoMovieVector3Tuple;
        /**
         * Plane normal in the curve's declared frame; its direction defines the
         * constraint plane.
         */
        normal: AutoMovieVector3Tuple;
      }
    | {
        /** The closed curve's perimeter equals the tape. */
        kind: "perimeter";
        /** Required geometric distance or arc length, millimetres. */
        length: number;
        /** Measurement or construction provenance for this required distance. */
        source: ISource;
      }
    | {
        /** The closed curve's extent along `direction` equals `length`. */
        kind: "breadth";
        /**
         * Tangent direction in the curve's declared frame, with magnitude
         * ignored by the directional constraint.
         */
        direction: AutoMovieVector3Tuple;
        /** Required geometric distance or arc length, millimetres. */
        length: number;
        /** Measurement or construction provenance for this required distance. */
        source: ISource;
      }
    | {
        /**
         * The open curve shares the neighbour's position and tangent where they
         * meet.
         */
        kind: "continuity";
        /** Identity of the adjacent curve whose boundary jet must agree. */
        neighbour: string;
        /** Required boundary agreement: 0 for position, 1 for tangent direction. */
        order: 0 | 1;
      }
    | {
        /**
         * Where the curve passes the named datum, its tangent is parallel to
         * `direction` with the same sense (G1 to that direction). `direction`
         * is a unit vector in the spec's frame; its length carries no speed.
         */
        kind: "tangent";
        /** Name of the previously declared datum that constrains this curve. */
        datum: string;
        /**
         * Tangent direction in the curve's declared frame, with magnitude
         * ignored by the directional constraint.
         */
        direction: AutoMovieVector3Tuple;
      }
    | {
        /**
         * The curve's extremum along the unit `axis` (spec frame) on the
         * parameter `interval` lies at the named datum: `sense` "max" means no
         * point of the interval reaches farther along `axis` than the datum,
         * "min" the reverse. `value` is the datum's coordinate along `axis`
         * from the frame origin, calibration mm.
         */
        kind: "extremum";
        /** Name of the previously declared datum that constrains this curve. */
        datum: string;
        /**
         * Direction along which the extremum or monotonicity is tested in the
         * declared frame.
         */
        axis: AutoMovieVector3Tuple;
        /** Which extremum or direction of monotonic change the curve must have. */
        sense: "max" | "min";
        /** Required coordinate along the declared constraint axis, millimetres. */
        value: number;
        /**
         * Inclusive interval of the curve's declared parameter on which this
         * constraint applies.
         */
        interval: [number, number];
      }
    | {
        /**
         * The coordinate along the unit `axis` (spec frame) is monotone over
         * the parameter `interval`: "increasing" or "decreasing" in the curve's
         * own parameter direction.
         */
        kind: "monotone";
        /**
         * Direction along which the extremum or monotonicity is tested in the
         * declared frame.
         */
        axis: AutoMovieVector3Tuple;
        /** Which extremum or direction of monotonic change the curve must have. */
        sense: "increasing" | "decreasing";
        /**
         * Inclusive interval of the curve's declared parameter on which this
         * constraint applies.
         */
        interval: [number, number];
      }
    | {
        /**
         * The signed curvature of the curve projected on the plane with unit
         * `normal` (spec frame) keeps `sign` over the parameter `interval`: +1
         * turns counter-clockwise about `normal`, -1 clockwise. A straight
         * interval satisfies neither sign.
         */
        kind: "curvature-sign";
        /**
         * Plane normal in the curve's declared frame; its direction defines the
         * constraint plane.
         */
        normal: AutoMovieVector3Tuple;
        /**
         * Required signed curvature orientation relative to the declared
         * normal.
         */
        sign: 1 | -1;
        /**
         * Inclusive interval of the curve's declared parameter on which this
         * constraint applies.
         */
        interval: [number, number];
      };

  /** Closed section representation: an ellipse in its plane. */
  export interface IEllipse {
    /** Representation tag. */
    kind: "ellipse";

    /** Centre, local frame. */
    centre: AutoMovieVector3Tuple;

    /** First unit in-plane axis, local frame. */
    u: AutoMovieVector3Tuple;

    /** Second unit in-plane axis, local frame. */
    v: AutoMovieVector3Tuple;

    /** Semi-axis along `u`. */
    a: number;

    /** Semi-axis along `v`. */
    b: number;
  }

  /**
   * One knot of a scalar view outline (classic conic lofting's longitudinal
   * control line): the signed chart offset, or the conic shoulder, at a
   * station, with its first and second derivatives in the outline's own source
   * parameter `q` (not in station unless the parameter is the station). The
   * engine's `AutoMovieEngineViewHermite` evaluates the same quintic Hermite spans
   * from these jets.
   */
  export interface IOutlineKnot {
    /** Site name, such as `elbow` or `bottom pole`. */
    site: string;

    /**
     * Station along the segment's own axis from its own zero (the segment's
     * proximal datum), calibration mm; `IOutline.walk + station` is the walk
     * station.
     */
    station: number;

    /**
     * Source parameter value at the station, in the unit `IOutline.parameter`
     * names.
     */
    q: number;

    /** Value: chart offset in calibration mm, or a dimensionless conic shoulder. */
    value: number;

    /** D value / dq. */
    first: number;

    /** D2 value / dq2. */
    second: number;
  }

  /**
   * A scalar view outline: a C2 quintic Hermite chain in the source parameter,
   * one value per station, read by the engine as one signed edge of the section
   * box or as the conic shoulder (rho) fullness law.
   */
  export interface IOutline {
    /** Representation tag. */
    kind: "outline";

    /** Meaning and unit of `q`, such as the engine's two-pole angle parameter. */
    parameter: string;

    /**
     * Unit direction the value measures along at neutral, spec frame; null for
     * a dimensionless fullness.
     */
    direction: AutoMovieVector3Tuple | null;

    /**
     * Walk station of the segment's own zero at neutral (the arm walk runs from
     * the acromion pole), calibration mm: the frame map from segment station to
     * walk station.
     */
    walk: number;

    /**
     * The segment's physical interval in its own stations, mm; knots outside it
     * are interpolation support only.
     */
    domain: [number, number];

    /** Knots by increasing station. */
    knots: IOutlineKnot[];

    /** How every value, slope and second derivative is derived, with its basis. */
    handleRule: string;
  }

  /**
   * A closed conic section (classic conic lofting): four quarter conics on a
   * box about the axis, each from one guide to the next with tangents along the
   * box sides and its shoulder `rho` the share of the corner diagonal from the
   * chord's midpoint to the corner (`AutoMovieEngineViewSection`). `rho = sqrt(2) -
   * 1` makes every quarter an exact quarter ellipse.
   */
  export interface IConicLoop {
    /** Representation tag. */
    kind: "conic";

    /** Station of the loop on the walk course, calibration mm. */
    station: number;

    /**
     * Half extents along the engine chart's +u, +v, -u, -v, calibration mm, all
     * positive.
     */
    extents: [number, number, number, number];

    /** Conic shoulder per quarter, dimensionless in (0, 1). */
    shoulders: [number, number, number, number];
  }

  /**
   * A construction aid drawn beside, never inside, the anatomical curves: a
   * polyline in its frame. `kind` names the drafting role so a renderer can
   * colour it and a reader can judge a curve against it first.
   */
  export interface IAid {
    /** Drafting role. */
    kind:
      | "axis"
      | "rectangle"
      | "chord"
      | "tick"
      | "division"
      | "tangent"
      | "extremum"
      | "plane"
      | "polygon";

    /** Aid name, such as `tangent anterior at elbow`. */
    name: string;

    /** Frame the points are written in. */
    frame: string;

    /** Polyline vertices, calibration mm. */
    points: AutoMovieVector3Tuple[];
  }

  /**
   * Piecewise cubic Bézier chain in the spec's frame, calibration mm. Span `i`
   * has the on-curve start `points[3i]`, the handles `points[3i + 1]` and
   * `points[3i + 2]`, and the on-curve end `points[3i + 3]`. An open chain of
   * `n` spans has `3n + 1` points; a closed chain has `3n` points and its last
   * span ends at `points[0]` without repeating it. The chain parameter is `u =
   * i + t` with span-local `t` in [0, 1]. Aligned nonzero handles on both sides
   * of an on-curve point give G1 there, not C1/C2.
   */
  export interface IBezierChain {
    /** Representation tag. */
    kind: "bezier";

    /**
     * On-curve points and handles in the layout above, spec frame, calibration
     * mm.
     */
    points: AutoMovieVector3Tuple[];

    /** Whether the last span returns to `points[0]`. */
    closed: boolean;

    /**
     * How every handle is derived from datums, dimensions or a declared
     * construction, with its basis.
     */
    handleRule: string;
  }

  /**
   * One knot of a quintic Hermite chain: position and the first and second
   * derivatives with respect to the chain's own parameter `q`, spec frame.
   */
  export interface IHermiteKnot {
    /**
     * Parameter value; strictly increasing along the chain, in the unit
     * `IQuinticHermite.parameter` names.
     */
    q: number;

    /** Position, calibration mm. */
    position: AutoMovieVector3Tuple;

    /** DP/dq, calibration mm per parameter unit. */
    first: AutoMovieVector3Tuple;

    /** D2P/dq2, calibration mm per parameter unit squared. */
    second: AutoMovieVector3Tuple;
  }

  /**
   * Quintic Hermite chain: each span between consecutive knots is the
   * polynomial quintic fixed by both endpoints' positions, first and second
   * derivatives in `q`, so the chain is C2 in `q` across its knots. Its exact
   * six-point Bézier form follows human/curves.md "Preserve The Actual
   * Parameter" ({@link quinticControls}).
   */
  export interface IQuinticHermite {
    /** Representation tag. */
    kind: "quintic-hermite";

    /** Meaning and unit of `q`, e.g. "mm along the humerus -Y from GH". */
    parameter: string;

    /** Knots in increasing `q`. */
    knots: IHermiteKnot[];

    /**
     * How every derivative is derived from datums, dimensions or a declared
     * construction, with its basis.
     */
    handleRule: string;
  }

  /** One original curve specification. */
  export interface ICurveSpec {
    /** Curve name. */
    name: string;

    /** Frame its datums and representation are written in. */
    frame: string;

    /** Datums it reads. */
    datums: IDatum[];

    /** Constraints it must satisfy. */
    constraints: IConstraint[];

    /** Representation; handles derive from it by its stated rule. */
    representation:
      | IEllipse
      | IOutline
      | IConicLoop
      | IBezierChain
      | IQuinticHermite;

    /** Construction aids drawn with the curve and judged before the reference. */
    aids: IAid[];

    /** Readers of this curve and the interval each reads. */
    consumers: string[];
  }
}
