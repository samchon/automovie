import {
  AutoMoviePchip64,
  type IAutoMovieCurve64 as C,
  rootsAutoMovieCubicBernstein64,
} from "@automovie/engine";

/** Binary64 equations used by the original cubic-course and local PCHIP family. */
export namespace AutoMovieFootMath64 {
  /**
   * Point, direction or derivative with three components; the caller declares its units.
   */
  export type V = C.Vector;
  /**
   * Cubic Bernstein coefficients P0/P1/P2/P3 in one spatial chart.
   */
  export type S = C.Span;
  /**
   * Orthonormal local-to-world chart, including an explicit anatomical reflection if used.
   *
   * @author Samchon
   */
  export interface Frame {
    /** World position of the local origin, in millimetres. */
    origin: V;

    /** Ordered world unit vectors for local X, Y and Z; stored as three axis vectors. */
    basis: C.Matrix;
  }

  /**
   * Selected intersection of a transverse course and a constant local-X plane.
   *
   * @author Samchon
   */
  export interface Crossing {
    /** Selected world-millimetre point. */
    point: V;

    /** Equal-span normalized parameter used to re-query the same support family. */
    theta: number;
  }
  /**
   * Componentwise sum in one shared chart; performs no frame or unit conversion.
   */
  export const add: (a: V, b: V) => V = (a: V, b: V): V => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2],
  ];
  /**
   * Componentwise difference in one shared chart; points yield a displacement.
   */
  export const sub: (a: V, b: V) => V = (a: V, b: V): V => [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2],
  ];
  /**
   * Scale every component; scalar units determine the result, such as a jet times millimetres.
   */
  export const mul: (a: V, b: number) => V = (a: V, b: number): V => [
    a[0] * b,
    a[1] * b,
    a[2] * b,
  ];
  /**
   * Euclidean scalar product; both inputs must use the same orthonormal chart.
   */
  export const dot: (a: V, b: V) => number = (a: V, b: V): number =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  /**
   * Euclidean length in the input vector's units.
   */
  export const norm: (a: V) => number = (a: V): number => Math.hypot(...a);
  /**
   * Normalize a nonzero vector; a zero input deliberately returns the zero vector.
   */
  export const unit: (a: V) => V = (a: V): V =>
    norm(a) ? mul(a, 1 / norm(a)) : [0, 0, 0];
  /**
   * Subtract the world origin and project on orthonormal axes. The transpose is the inverse even when anatomical chirality reflects X.
   */
  export const local: (f: Frame, a: V) => V = (f: Frame, a: V): V => {
    const q: V = sub(a, f.origin);
    return [dot(q, f.basis[0]), dot(q, f.basis[1]), dot(q, f.basis[2])];
  };
  /**
   * Expand local vector components on the supplied basis without translating. The caller supplies the frame and owns its admission; this helper does not validate it.
   */
  export const direction: (basis: C.Matrix, a: V) => V = (
    basis: C.Matrix,
    a: V,
  ): V =>
    add(add(mul(basis[0], a[0]), mul(basis[1], a[1])), mul(basis[2], a[2]));
  /**
   * Expand a local millimetre point and add the frame's world-millimetre origin.
   */
  export const world: (f: Frame, a: V) => V = (f: Frame, a: V): V =>
    add(f.origin, direction(f.basis, a));
  /**
   * Arithmetic centroid of a nonempty collection in one chart. An empty collection is unsupported and is not rejected here.
   */
  export const mean: (values: readonly V[]) => V = (values: readonly V[]): V =>
    mul(
      values.reduce((a: V, b: V): V => add(a, b), [0, 0, 0]),
      1 / values.length,
    );
  /**
   * Evaluate the cubic Bernstein polynomial at local t. The usual span is [0,1]; the family also explicitly uses polynomial extrapolation.
   */
  export const bezier: (p: S, t: number) => V = (p: S, t: number): V => {
    const s: number = 1 - t;
    return add(
      add(mul(p[0], s * s * s), mul(p[1], 3 * s * s * t)),
      add(mul(p[2], 3 * s * t * t), mul(p[3], t * t * t)),
    );
  };
  /**
   * Derivative with respect to local cubic t, not millimetres or a published phase. Callers divide by the physical interval when constructing a per-millimetre jet.
   */
  export const derivative: (p: S, t: number) => V = (p: S, t: number): V => {
    const s: number = 1 - t;
    return mul(
      add(
        add(mul(sub(p[1], p[0]), s * s), mul(sub(p[2], p[1]), 2 * s * t)),
        mul(sub(p[3], p[2]), t * t),
      ),
      3,
    );
  };
  /**
   * Join ordered transverse supports by cubic spans sharing support tangents. The 0.26 neighbouring-chord handle rule is a geometric convention. Unconstrained handles are shortened against the support height envelope; declared cardinal directions override the centred chord and optional end jets then replace end handles. End jets use increasing-up millimetres and signed height differences divided by three. Zero handles can remain; this construction is not a global regularity certificate.
   */
  export function course(
    points: readonly V[],
    closed: boolean,
    up: V,
    cardinal: Readonly<Record<number, V>>,
    jets?: readonly [V, V],
  ): S[] {
    const heights: number[] = points.map((p: V): number => dot(p, up));
    const lo: number = Math.min(...heights);
    const hi: number = Math.max(...heights);
    const tangents: V[] = [];
    const lengths: number[] = [];
    const n: number = points.length;
    for (let i: number = 0; i < n; i++) {
      const q: V = points[i]!;
      const before: V =
        closed || i ? points[(i + n - 1) % n]! : sub(q, sub(points[1]!, q));
      const after: V =
        closed || i < n - 1
          ? points[(i + 1) % n]!
          : add(q, sub(q, points[i - 1]!));
      let tangent: V = cardinal[i] ?? sub(after, before);
      const h: number = heights[i]!;
      if (Math.min(Math.abs(h - lo), Math.abs(h - hi)) < 1e-9)
        tangent = sub(tangent, mul(up, dot(tangent, up)));
      tangent = unit(tangent);
      let length: number =
        0.26 * Math.min(norm(sub(q, before)), norm(sub(after, q)));
      const vertical: number = dot(tangent, up);
      if (Math.abs(vertical) > 1e-8)
        length = Math.min(
          length,
          Math.max(0, Math.min(h - lo, hi - h)) / Math.abs(vertical),
        );
      tangents.push(tangent);
      lengths.push(length);
    }
    const spans: S[] = [];
    for (let i: number = 0; i < (closed ? n : n - 1); i++) {
      const j: number = (i + 1) % n;
      spans.push([
        points[i]!,
        add(points[i]!, mul(tangents[i]!, lengths[i]!)),
        sub(points[j]!, mul(tangents[j]!, lengths[j]!)),
        points[j]!,
      ]);
    }
    if (jets) {
      const first: S = spans[0]!;
      const last: S = spans[spans.length - 1]!;
      spans[0] = [
        first[0],
        add(first[0], mul(jets[0], dot(sub(points[1]!, points[0]!), up) / 3)),
        first[2],
        first[3],
      ];
      spans[spans.length - 1] = [
        last[0],
        last[1],
        sub(
          last[3],
          mul(jets[1], dot(sub(points[n - 1]!, points[n - 2]!), up) / 3),
        ),
        last[3],
      ];
    }
    return spans;
  }
  /**
   * Shape-preserving cubic Hermite slopes for increasing physical stations. Weighted harmonic interior slopes and one-sided endpoint limiting follow PCHIP, as documented at https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html. Returns dy/dx, with a common secant for two points. Station shape/order is checked; the caller must also supply finite ordinates.
   */
  export const pchip: typeof AutoMoviePchip64.slopes = AutoMoviePchip64.slopes;
  /**
   * Isolate roots of four scalar Bernstein coefficients on [0,1] using derivative critical points. Near-zero tests use 64 epsilon times the coefficient scale; sign-changing intervals receive 58 bisections and parameter roots within 1e-10 are merged. The identically zero polynomial returns no discrete roots. These binary64 rules are not interval proofs.
   */
  export const roots: typeof rootsAutoMovieCubicBernstein64 =
    rootsAutoMovieCubicBernstein64;
  /**
   * Intersect world cubic courses with local forward plane Z=w in millimetres. Each result carries the point and its corresponding supplied jet. Coincident hits within 1e-6 mm are merged, then sorted from medial to lateral local X. The point and jet arrays must describe the same spans.
   */
  export function intersections(
    p: readonly S[],
    j: readonly S[],
    f: Frame,
    w: number,
  ): [V, V][] {
    const hits: [V, V][] = [];
    p.forEach((span: S, i: number): void => {
      for (const t of roots(span.map((v: V): number => local(f, v)[2] - w))) {
        const point: V = bezier(span, t);
        if (
          hits.every((hit: [V, V]): boolean => norm(sub(point, hit[0])) > 1e-6)
        )
          hits.push([point, bezier(j[i]!, t)]);
      }
    });
    return hits.sort(
      (a: [V, V], b: [V, V]): number => local(f, a[0])[0] - local(f, b[0])[0],
    );
  }
  /**
   * Find the highest or lowest hit of a course at local lateral coordinate u. Returns a world point and equal-span normalized theta for the branch derivative query; this theta is not arc length. Throws when no span crosses the plane.
   */
  export function crossing(
    spans: readonly S[],
    f: Frame,
    u: number,
    upper: boolean,
  ): Crossing {
    const hits: (Crossing & {
      /** Local upward coordinate used to choose the highest or lowest hit. */
      height: number;
    })[] = [];
    spans.forEach((span: S, i: number): void => {
      for (const t of roots(span.map((v: V): number => local(f, v)[0] - u))) {
        const point: V = bezier(span, t);
        hits.push({
          point,
          theta: (i + t) / spans.length,
          height: local(f, point)[1],
        });
      }
    });
    if (!hits.length) throw new Error("Branch lies outside actual main course");
    return hits.reduce(
      (
        a: (typeof hits)[number],
        b: (typeof hits)[number],
      ): (typeof hits)[number] =>
        (upper ? b.height > a.height : b.height < a.height) ? b : a,
    );
  }
}
