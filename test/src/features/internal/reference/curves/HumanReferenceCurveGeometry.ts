/**
 * Cubic Hermite section curves as the reference curve pack stores them, and
 * their evaluation. Millimetres throughout; a curve's parameter is its phase,
 * in phase millimetres, which follows arc length closely, and every stored
 * tangent is per phase millimetre.
 */
export namespace HumanReferenceCurveGeometry {
  /** A point or vector, mm. */
  export type V3 = [number, number, number];

  /** One cubic Hermite span: end positions and their derivatives per phase mm. */
  export interface ISpan {
    /** Position at the span's start, mm. */
    start: V3;

    /** Position at the span's end, mm. */
    end: V3;

    /** Derivative at the start, mm per phase mm. */
    startDerivative: V3;

    /** Derivative at the end, mm per phase mm. */
    endDerivative: V3;
  }

  /** One fitted section curve as Recovery saved it. */
  export interface ICurve {
    /** Always a cubic Hermite in this pack. */
    type: "cubicHermite";

    /** Recovery's curve name, carrying its section coordinate and contour ordinal. */
    name: string;

    /** Whether the curve closes on itself; open arcs end at a mesh boundary. */
    closed: boolean;

    /** Spatial unit. */
    unit: "mm";

    /** Phase unit of `phaseIntervals` and of the derivatives. */
    phaseUnit: "mm";

    /** Phase width of every span, in order. */
    phaseIntervals: number[];

    /** Spans in curve order. */
    spans: ISpan[];
  }

  /** A phase located on a curve. */
  export interface ILocation {
    /** Ordinal of the span holding the phase. */
    span: number;

    /** Local parameter in [0, 1] on that span. */
    t: number;
  }

  /** Total phase length of a curve, the sum of its phase widths (about its arc length, mm). */
  export function length(curve: ICurve): number {
    return curve.phaseIntervals.reduce((a: number, w: number): number => a + w, 0);
  }

  /**
   * The span and local parameter of a phase. A closed curve's phase wraps and
   * an open curve's is clamped to [0, length]; an interior span seam belongs
   * to the following span, and the final end to the last span at t = 1.
   *
   * @throws Error when the curve has no phase or no span.
   */
  export function locate(curve: ICurve, phase: number): ILocation {
    const total: number = length(curve);
    if (!(total > 0)) throw new Error(`Curve ${curve.name} has no phase`);

    let remaining: number = curve.closed ? ((phase % total) + total) % total : Math.min(Math.max(phase, 0), total);
    for (let i: number = 0; i < curve.spans.length; i++) {
      const width: number = curve.phaseIntervals[i]!;
      if (remaining < width || i === curve.spans.length - 1) return { span: i, t: Math.min(remaining / width, 1) };

      remaining -= width;
    }
    throw new Error(`Curve ${curve.name} has no spans`);
  }

  /**
   * Cubic Hermite position, mm, on a span of phase width `h` (phase mm) at
   * local `t` in [0, 1].
   */
  export function point(s: ISpan, h: number, t: number): V3 {
    // Cubic Hermite basis: H00 = 2t^3 - 3t^2 + 1, H10 = t^3 - 2t^2 + t,
    // H01 = -2t^3 + 3t^2, H11 = t^3 - t^2, with p(t) = H00 P0 + H10 h D0 +
    // H01 P1 + H11 h D1. The stored tangents D0, D1 are per phase mm, while t
    // runs over the span's phase width h, so dp/dt = h dp/dphase at the ends:
    // the tangent terms are scaled by h to put them in mm per unit t. Positions
    // P0, P1 are mm, h is phase mm, and the result is mm in the pack's frame.
    const t2: number = t * t;
    const t3: number = t2 * t;
    const a: number = 2 * t3 - 3 * t2 + 1;
    const b: number = (t3 - 2 * t2 + t) * h;
    const c: number = -2 * t3 + 3 * t2;
    const d: number = (t3 - t2) * h;

    return [0, 1, 2].map((k: number): number => a * s.start[k]! + b * s.startDerivative[k]! + c * s.end[k]! + d * s.endDerivative[k]!) as V3;
  }

  /**
   * A curve's position, mm, at a phase in [0, length], located as `locate`
   * does.
   */
  export function evaluate(curve: ICurve, phase: number): V3 {
    const at: ILocation = locate(curve, phase);

    return point(curve.spans[at.span]!, curve.phaseIntervals[at.span]!, at.t);
  }

  /**
   * A curve's derivative with respect to phase at a phase, located as
   * `locate` does: mm per phase mm, so its length is about 1 where the phase
   * follows arc length. At an interior seam it is the following span's start
   * derivative.
   */
  export function derivative(curve: ICurve, phase: number): V3 {
    const at: ILocation = locate(curve, phase);
    const s: ISpan = curve.spans[at.span]!;
    const h: number = curve.phaseIntervals[at.span]!;
    const t: number = at.t;

    // The span is p(t) = H00(t) P0 + H10(t) h D0 + H01(t) P1 + H11(t) h D1 on
    // local t in [0, 1] (see `point`). Phase is phi = phi0 + h t, so
    // d/dphi = (1 / h) d/dt. Differentiating: the position terms take the
    // basis derivatives H00' = 6t^2 - 6t and H01' = -6t^2 + 6t divided by h
    // (mm / phase mm); the tangent terms take H10' = 3t^2 - 4t + 1 and
    // H11' = 3t^2 - 2t, whose h factor cancels the 1 / h, so the stored
    // per-phase tangents D0, D1 enter unscaled. Result: mm per phase mm.
    const t2: number = t * t;
    const a: number = (6 * t2 - 6 * t) / h;
    const b: number = 3 * t2 - 4 * t + 1;
    const c: number = (-6 * t2 + 6 * t) / h;
    const d: number = 3 * t2 - 2 * t;

    return [0, 1, 2].map((k: number): number => a * s.start[k]! + b * s.startDerivative[k]! + c * s.end[k]! + d * s.endDerivative[k]!) as V3;
  }

  /**
   * A curve as a polyline: every span sampled at `samples` equal steps of its
   * local parameter. A closed curve does not repeat its first point; an open
   * curve ends on its last point.
   */
  export function polyline(curve: ICurve, samples: number = 8): V3[] {
    const out: V3[] = [];
    curve.spans.forEach((s: ISpan, i: number): void => {
      for (let k: number = 0; k < samples; k++) out.push(point(s, curve.phaseIntervals[i]!, k / samples));
    });

    if (!curve.closed && curve.spans.length > 0)
      out.push(point(curve.spans[curve.spans.length - 1]!, curve.phaseIntervals[curve.phaseIntervals.length - 1]!, 1));

    return out;
  }
}
