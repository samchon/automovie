/**
 * Typed curve specification for the arm experiment: every original arm curve
 * names its own local frame, its datums with their sources, its constraints,
 * its representation and handle rule, and its consumers. Frames are rigid
 * transforms relative to their parent, so a world placement exists only by
 * composing parents. Units are the public input's calibration millimetres.
 */
export namespace AutoMovieHumanArmCurveSpec {
  /** Point or direction, calibration mm. */
  export type Vec3 = [number, number, number];

  /**
   * Rigid transform of a child frame into its parent: a child point `p` lies
   * at `origin + axes[0] * p[0] + axes[1] * p[1] + axes[2] * p[2]` in the
   * parent. `axes` are orthonormal and right-handed.
   */
  export interface ITransform {
    /** Child origin in parent coordinates. */
    origin: Vec3;

    /** Child X, Y and Z axes in parent coordinates. */
    axes: [Vec3, Vec3, Vec3];
  }

  /** Where a datum's value comes from. */
  export type ISource =
    | {
        /** A field of the public input. */
        kind: "input";
        field: string;
      }
    | {
        /** A published relation or definition. */
        kind: "published";
        citation: string;
        detail: string;
      }
    | {
        /** A construction derived from other datums. */
        kind: "derived";
        rule: string;
      }
    | {
        /** Unsourced value kept visibly as debt. */
        kind: "debt";
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

  /** A named point (and optional direction) expressed in one frame. */
  export interface IDatum {
    /** Datum name. */
    name: string;

    /** Frame the coordinates are expressed in. */
    frame: string;

    /** Local coordinates, calibration mm. */
    point: Vec3;

    /** Basis of the value. */
    source: ISource;
  }

  /** A constraint the constructed curve must satisfy, checked independently of the constructor. */
  export type IConstraint =
    | {
        /** The curve passes through the datum. */
        kind: "pass";
        datum: string;
      }
    | {
        /** The closed curve lies in the plane through `origin` with unit `normal`. */
        kind: "planar";
        origin: Vec3;
        normal: Vec3;
      }
    | {
        /** The closed curve's perimeter equals the tape. */
        kind: "perimeter";
        length: number;
        source: ISource;
      }
    | {
        /** The closed curve's extent along `direction` equals `length`. */
        kind: "breadth";
        direction: Vec3;
        length: number;
        source: ISource;
      }
    | {
        /** The open curve shares the neighbour's position and tangent where they meet. */
        kind: "continuity";
        neighbour: string;
        order: 0 | 1;
      }
    | {
        /**
         * Where the curve passes the named datum, its tangent is parallel to
         * `direction` with the same sense (G1 to that direction). `direction`
         * is a unit vector in the spec's frame; its length carries no speed.
         */
        kind: "tangent";
        datum: string;
        direction: Vec3;
      }
    | {
        /**
         * The curve's extremum along the unit `axis` (spec frame) on the
         * parameter `interval` lies at the named datum: `sense` "max" means
         * no point of the interval reaches farther along `axis` than the
         * datum, "min" the reverse. `value` is the datum's coordinate along
         * `axis` from the frame origin, calibration mm.
         */
        kind: "extremum";
        datum: string;
        axis: Vec3;
        sense: "max" | "min";
        value: number;
        interval: [number, number];
      }
    | {
        /**
         * The coordinate along the unit `axis` (spec frame) is monotone over
         * the parameter `interval`: "increasing" or "decreasing" in the
         * curve's own parameter direction.
         */
        kind: "monotone";
        axis: Vec3;
        sense: "increasing" | "decreasing";
        interval: [number, number];
      }
    | {
        /**
         * The signed curvature of the curve projected on the plane with unit
         * `normal` (spec frame) keeps `sign` over the parameter `interval`:
         * +1 turns counter-clockwise about `normal`, -1 clockwise. A straight
         * interval satisfies neither sign.
         */
        kind: "curvature-sign";
        normal: Vec3;
        sign: 1 | -1;
        interval: [number, number];
      };

  /** Closed section representation: an ellipse in its plane. */
  export interface IEllipse {
    /** Representation tag. */
    kind: "ellipse";

    /** Centre, local frame. */
    centre: Vec3;

    /** First unit in-plane axis, local frame. */
    u: Vec3;

    /** Second unit in-plane axis, local frame. */
    v: Vec3;

    /** Semi-axis along `u`. */
    a: number;

    /** Semi-axis along `v`. */
    b: number;
  }

  /**
   * One knot of a scalar view outline (classic conic lofting's longitudinal
   * control line): the signed chart offset, or the conic shoulder, at a
   * station, with its first and second derivatives in the outline's own
   * source parameter `q` (not in station unless the parameter is the
   * station). The engine's `AutoMovieViewHermite` evaluates the same quintic
   * Hermite spans from these jets.
   */
  export interface IOutlineKnot {
    /** Site name, such as `elbow` or `bottom pole`. */
    site: string;

    /** Station along the segment's own axis from its own zero (the segment's proximal datum), calibration mm; `IOutline.walk + station` is the walk station. */
    station: number;

    /** Source parameter value at the station, in the unit `IOutline.parameter` names. */
    q: number;

    /** Value: chart offset in calibration mm, or a dimensionless conic shoulder. */
    value: number;

    /** d value / dq. */
    first: number;

    /** d2 value / dq2. */
    second: number;
  }

  /**
   * A scalar view outline: a C2 quintic Hermite chain in the source
   * parameter, one value per station, read by the engine as one signed edge
   * of the section box or as the conic shoulder (rho) fullness law.
   */
  export interface IOutline {
    /** Representation tag. */
    kind: "outline";

    /** Meaning and unit of `q`, such as the engine's two-pole angle parameter. */
    parameter: string;

    /** Unit direction the value measures along at neutral, spec frame; null for a dimensionless fullness. */
    direction: Vec3 | null;

    /** Walk station of the segment's own zero at neutral (the arm walk runs from the acromion pole), calibration mm: the frame map from segment station to walk station. */
    walk: number;

    /** The segment's physical interval in its own stations, mm; knots outside it are interpolation support only. */
    domain: [number, number];

    /** Knots by increasing station. */
    knots: IOutlineKnot[];

    /** How every value, slope and second derivative is derived, with its basis. */
    handleRule: string;
  }

  /**
   * A closed conic section (classic conic lofting): four quarter conics on a
   * box about the axis, each from one guide to the next with tangents along
   * the box sides and its shoulder `rho` the share of the corner diagonal from
   * the chord's midpoint to the corner (`AutoMovieViewSection`). `rho =
   * sqrt(2) - 1` makes every quarter an exact quarter ellipse.
   */
  export interface IConicLoop {
    /** Representation tag. */
    kind: "conic";

    /** Station of the loop on the walk course, calibration mm. */
    station: number;

    /** Half extents along the engine chart's +u, +v, -u, -v, calibration mm, all positive. */
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
    points: Vec3[];
  }

  /**
   * Piecewise cubic Bézier chain in the spec's frame, calibration mm. Span
   * `i` has the on-curve start `points[3i]`, the handles `points[3i + 1]`
   * and `points[3i + 2]`, and the on-curve end `points[3i + 3]`. An open
   * chain of `n` spans has `3n + 1` points; a closed chain has `3n` points
   * and its last span ends at `points[0]` without repeating it. The chain
   * parameter is `u = i + t` with span-local `t` in [0, 1]. Aligned nonzero
   * handles on both sides of an on-curve point give G1 there, not C1/C2.
   */
  export interface IBezierChain {
    /** Representation tag. */
    kind: "bezier";

    /** On-curve points and handles in the layout above, spec frame, calibration mm. */
    points: Vec3[];

    /** Whether the last span returns to `points[0]`. */
    closed: boolean;

    /** How every handle is derived from datums, dimensions or a declared construction, with its basis. */
    handleRule: string;
  }

  /**
   * One knot of a quintic Hermite chain: position and the first and second
   * derivatives with respect to the chain's own parameter `q`, spec frame.
   */
  export interface IHermiteKnot {
    /** Parameter value; strictly increasing along the chain, in the unit `IQuinticHermite.parameter` names. */
    q: number;

    /** Position, calibration mm. */
    position: Vec3;

    /** dP/dq, calibration mm per parameter unit. */
    first: Vec3;

    /** d2P/dq2, calibration mm per parameter unit squared. */
    second: Vec3;
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

    /** How every derivative is derived from datums, dimensions or a declared construction, with its basis. */
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
    representation: IEllipse | IOutline | IConicLoop | IBezierChain | IQuinticHermite;

    /** Construction aids drawn with the curve and judged before the reference. */
    aids: IAid[];

    /** Readers of this curve and the interval each reads. */
    consumers: string[];
  }

  /** Apply a transform to a child point. */
  export function apply(t: ITransform, p: Vec3): Vec3 {
    return [0, 1, 2].map(
      (c: number): number =>
        t.origin[c]! +
        t.axes[0][c]! * p[0] +
        t.axes[1][c]! * p[1] +
        t.axes[2][c]! * p[2],
    ) as Vec3;
  }

  /** Apply only the rotation to a child direction. */
  export function rotate(t: ITransform, d: Vec3): Vec3 {
    return [0, 1, 2].map(
      (c: number): number =>
        t.axes[0][c]! * d[0] + t.axes[1][c]! * d[1] + t.axes[2][c]! * d[2],
    ) as Vec3;
  }

  /** Compose `parent ∘ child`: the child frame in the parent's parent. */
  export function compose(parent: ITransform, child: ITransform): ITransform {
    return {
      origin: apply(parent, child.origin),
      axes: [
        rotate(parent, child.axes[0]),
        rotate(parent, child.axes[1]),
        rotate(parent, child.axes[2]),
      ],
    };
  }

  /** Inverse rigid transform. */
  export function inverse(t: ITransform): ITransform {
    const axes: [Vec3, Vec3, Vec3] = [
      [t.axes[0][0], t.axes[1][0], t.axes[2][0]],
      [t.axes[0][1], t.axes[1][1], t.axes[2][1]],
      [t.axes[0][2], t.axes[1][2], t.axes[2][2]],
    ];
    const o: Vec3 = [0, 1, 2].map(
      (c: number): number =>
        -(axes[0][c]! * t.origin[0] +
          axes[1][c]! * t.origin[1] +
          axes[2][c]! * t.origin[2]),
    ) as Vec3;
    return { origin: o, axes };
  }

  /** Identity transform. */
  export const IDENTITY: ITransform = {
    origin: [0, 0, 0],
    axes: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  };

  /** Dot product. */
  export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * Point of a cubic Bézier chain at chain parameter `u = i + t` by de
   * Casteljau's algorithm; `u` is clamped to the chain's span range.
   */
  export function bezierPoint(chain: IBezierChain, u: number): Vec3 {
    const spans: number = bezierSpans(chain);
    const i: number = Math.min(spans - 1, Math.max(0, Math.floor(u)));
    const t: number = Math.min(1, Math.max(0, u - i));
    const p: Vec3[] = [0, 1, 2, 3].map(
      (k: number): Vec3 => chain.points[(3 * i + k) % chain.points.length]!,
    );
    const lerp: (a: Vec3, b: Vec3) => Vec3 = (a: Vec3, b: Vec3): Vec3 => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const a: Vec3[] = [lerp(p[0]!, p[1]!), lerp(p[1]!, p[2]!), lerp(p[2]!, p[3]!)];
    const b: Vec3[] = [lerp(a[0]!, a[1]!), lerp(a[1]!, a[2]!)];
    return lerp(b[0]!, b[1]!);
  }

  /** Number of cubic spans in a chain; throws on a layout that is not 3n + 1 (open) or 3n (closed). */
  export function bezierSpans(chain: IBezierChain): number {
    const n: number = chain.closed
      ? chain.points.length / 3
      : (chain.points.length - 1) / 3;
    if (!(Number.isInteger(n) && n >= 1))
      throw new Error("A Bézier chain needs 3n + 1 points (open) or 3n (closed)");
    return n;
  }

  /**
   * The six Bézier control points of the quintic Hermite span `a`..`b` in
   * the same parameter, exactly (human/curves.md "Preserve The Actual
   * Parameter"): with `h = b.q - a.q`, P1 = A + h A1 / 5, P2 = A + 2 h A1 / 5
   * + h^2 A2 / 20, P3 = B - 2 h B1 / 5 + h^2 B2 / 20, P4 = B - h B1 / 5.
   */
  export function quinticControls(a: IHermiteKnot, b: IHermiteKnot): Vec3[] {
    const h: number = b.q - a.q;
    if (!(h > 0)) throw new Error("A quintic Hermite span needs increasing q");
    const c: (f: (k: number) => number) => Vec3 = (
      f: (k: number) => number,
    ): Vec3 => [f(0), f(1), f(2)];
    return [
      a.position,
      c((k: number): number => a.position[k]! + (h * a.first[k]!) / 5),
      c(
        (k: number): number =>
          a.position[k]! + (2 * h * a.first[k]!) / 5 + (h * h * a.second[k]!) / 20,
      ),
      c(
        (k: number): number =>
          b.position[k]! - (2 * h * b.first[k]!) / 5 + (h * h * b.second[k]!) / 20,
      ),
      c((k: number): number => b.position[k]! - (h * b.first[k]!) / 5),
      b.position,
    ];
  }

  /** Point of a quintic Hermite chain at parameter `q` (clamped to the knot range), from its Bézier form. */
  export function quinticPoint(curve: IQuinticHermite, q: number): Vec3 {
    const k: IHermiteKnot[] = curve.knots;
    if (k.length < 2) throw new Error("A quintic Hermite chain needs two knots");
    let i: number = 0;
    while (i < k.length - 2 && q > k[i + 1]!.q) ++i;
    const p: Vec3[] = quinticControls(k[i]!, k[i + 1]!);
    const t: number = Math.min(1, Math.max(0, (q - k[i]!.q) / (k[i + 1]!.q - k[i]!.q)));
    const w: number[] = [0, 1, 2, 3, 4, 5].map(
      (j: number): number =>
        BINOMIAL5[j]! * Math.pow(1 - t, 5 - j) * Math.pow(t, j),
    );
    return [0, 1, 2].map((c: number): number =>
      p.reduce((s: number, x: Vec3, j: number): number => s + w[j]! * x[c]!, 0),
    ) as Vec3;
  }

  /** Binomial coefficients C(5, j). */
  const BINOMIAL5: number[] = [1, 5, 10, 10, 5, 1];

  /** Unit vector; throws on a zero vector instead of substituting one. */
  export function unit(a: Vec3): Vec3 {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    if (!(n > 0)) throw new Error("Zero direction in an arm frame");
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}
