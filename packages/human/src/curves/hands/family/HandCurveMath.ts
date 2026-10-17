import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Vector algebra and cubic Bernstein operators for the hand family; ellipse generators are emitted as cubic approximations rather than analytic conics. */
export namespace HandCurveMath {
  /** Three ordered components in the owning spatial/field chart; physical units are carried by the enclosing declaration. */
  export type V = [number, number, number];

  /** One cubic Bernstein span in P0, P1, P2, P3 order; its two handles are not through-points. */
  export type S = [V, V, V, V];

  /** Cubic coefficients in world millimetres, or a matching vector field when used by the tensor helpers. */
  export type Curve = {
    /** Semantic course name retained in the published primitive. */
    name: string;

    /** Requests a closed course; callers remain responsible for periodicity and nonintersection. */
    closed: boolean;

    /** Ordered Bernstein spans; P1 and P2 are handles, not through-points. */
    spans: S[];
  };

  /** Four longitudinal Bernstein rows, each containing the same four angular spans; longitudinal t is normalized and angular p runs from 0 to 4. */
  export type Tensor = [S[], S[], S[], S[]];

  /** Add vectors expressed in the same chart and units. */
  export const add: (a: C.Vector, b: C.Vector) => V = (
    a: C.Vector,
    b: C.Vector,
  ): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  /** Subtract vectors in their shared chart; no frame conversion or derivative rescaling is implicit. */
  export const sub: (a: C.Vector, b: C.Vector) => V = (
    a: C.Vector,
    b: C.Vector,
  ): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

  /** Scale every vector component by s; callers choose whether the result represents a position, displacement or derivative. */
  export const mul: (a: C.Vector, s: number) => V = (
    a: C.Vector,
    s: number,
  ): V => [a[0] * s, a[1] * s, a[2] * s];

  /** Compute the Euclidean scalar product in one declared chart; callers own the units of its two fields. */
  export const dot: (a: C.Vector, b: C.Vector) => number = (
    a: C.Vector,
    b: C.Vector,
  ): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /** Return the Euclidean length in the input vector's units. */
  export const norm: (a: C.Vector) => number = (a: C.Vector): number =>
    Math.sqrt(dot(a, a));

  /** Divide by max(length, 1e-14); zero stays zero, so callers must reject degenerate directions when a unit axis is required. */
  export const unit: (a: C.Vector) => V = (a: C.Vector): V =>
    mul(a, 1 / Math.max(1e-14, norm(a)));

  /** Compute the oriented cross product in one chart; callers retain its magnitude and any later normalization decision. */
  export const cross: (a: C.Vector, b: C.Vector) => V = (
    a: C.Vector,
    b: C.Vector,
  ): V => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  /** Apply a three-row matrix to p; rotation, basis change and units are the caller's responsibility. */
  export const matrix: (a: readonly C.Vector[], p: C.Vector) => V = (
    a: readonly C.Vector[],
    p: C.Vector,
  ): V => [dot(a[0]!, p), dot(a[1]!, p), dot(a[2]!, p)];

  /** Transpose a three-row matrix; for an orthonormal rotation this is its inverse. */
  export const transpose: (a: readonly C.Vector[]) => [V, V, V] = (
    a: readonly C.Vector[],
  ): [V, V, V] => [
    [a[0]![0], a[1]![0], a[2]![0]],
    [a[0]![1], a[1]![1], a[2]![1]],
    [a[0]![2], a[1]![2], a[2]![2]],
  ];

  /** Evaluate the actual cubic Bernstein coefficients at local t; phase and physical derivative conversion belong to the enclosing chart. */
  export function bez(p: S, t: number): V {
    const a: number = 1 - t;
    return [0, 1, 2].map(
      (k: number): number =>
        a ** 3 * p[0][k]! +
        3 * a * a * t * p[1][k]! +
        3 * a * t * t * p[2][k]! +
        t ** 3 * p[3][k]!,
    ) as V;
  }

  /** Interpolate stations with shared incoming/outgoing handle displacements. Unforced handles follow the neighbouring chord and use one quarter of the shorter adjacent distance, a construction convention; forced entries are millimetre displacements rather than derivatives. */
  export function curve(
    name: string,
    points: readonly C.Vector[],
    forced: ReadonlyMap<number, V> = new Map(),
    closed: boolean = false,
  ): Curve {
    if (points.length < 2)
      throw new Error("A hand course requires two distinct stations");
    const n: number = points.length;
    const handles: V[] = points.map((p: C.Vector, i: number): V => {
      const pre: C.Vector = i
        ? points[i - 1]!
        : closed
          ? points[n - 1]!
          : sub(mul(p, 2), points[1]!);
      const next: C.Vector =
        i < n - 1 || closed
          ? points[(i + 1) % n]!
          : sub(mul(p, 2), points[n - 2]!);
      return (
        forced.get(i) ??
        mul(
          unit(sub(next, pre)),
          0.25 * Math.min(norm(sub(p, pre)), norm(sub(next, p))),
        )
      );
    });
    const spans: S[] = Array.from(
      { length: closed ? n : n - 1 },
      (_: unknown, i: number): S => {
        const j: number = (i + 1) % n;
        return [
          [...points[i]!] as V,
          add(points[i]!, handles[i]!),
          sub(points[j]!, handles[j]!),
          [...points[j]!] as V,
        ];
      },
    );
    return { name, spans, closed };
  }

  /** Build a closed four-span section through four ordered cardinal positions. Handles use the quarter-circle kappa factor and opposite-node distances; this operator reads no source mesh and is not an exact ellipse evaluator. */
  export function sourceSection(name: string, q: V[], u: V, v: V): Curve {
    const k: number = (4 * (Math.sqrt(2) - 1)) / 3;
    const hu: number = (k * norm(sub(q[0]!, q[2]!))) / 2;
    const hv: number = (k * norm(sub(q[1]!, q[3]!))) / 2;
    return curve(
      name,
      q,
      new Map([
        [0, mul(v, hv)],
        [1, mul(u, -hu)],
        [2, mul(v, -hv)],
        [3, mul(u, hu)],
      ]),
      true,
    );
  }

  /** Approximate center + a*cos(t) + b*sin(t) with four cubic quarter spans. Phase starts at the analytic generator's support in directions[0], and chirality selects winding relative to the supplied normal; a and b may be affinely scaled, nonorthogonal semiaxes. */
  export function ellipse(
    name: string,
    center: V,
    a: V,
    b: V,
    normal: V,
    directions: [V, V],
    chirality: number,
  ): Curve {
    // Rotating the two generating ellipse columns by the right singular vectors
    // preserves this support-aligned operator, so no SVD axis-sign convention is needed.
    const angle: number = Math.atan2(
      dot(b, directions[0]),
      dot(a, directions[0]),
    );
    const orientation: number =
      chirality *
      (dot(cross(directions[0], directions[1]), normal) < 0 ? -1 : 1);
    const q: (t: number) => V = (t: number): V =>
      add(center, add(mul(a, Math.cos(t)), mul(b, Math.sin(t))));
    const d: (t: number) => V = (t: number): V =>
      add(mul(a, -Math.sin(t)), mul(b, Math.cos(t)));
    const spans: S[] = Array.from({ length: 4 }, (_: unknown, i: number): S => {
      const t0: number = angle + (orientation * i * Math.PI) / 2;
      const t1: number = angle + (orientation * (i + 1) * Math.PI) / 2;
      const k: number = (4 / 3) * Math.tan((t1 - t0) / 4);
      return [
        q(t0),
        add(q(t0), mul(d(t0), k)),
        sub(q(t1), mul(d(t1), k)),
        q(t1),
      ];
    });
    return { name, closed: true, spans };
  }

  /** Evaluate a four-span periodic section in quarter-span units: p=0..4 is one turn, with wrapping outside that interval. */
  export function phase(c: Curve, p: number): V {
    const i: number = Math.floor(p);
    return bez(c.spans[((i % 4) + 4) % 4]!, p - i);
  }

  /** Find the largest directional projection among cubic endpoints and interior derivative roots; return its millimetre point and span-index-plus-local-t phase. This uses floating-point algebra, not a certified error bound. */
  export function support(
    c: Curve,
    g0: V,
  ): {
    /** Position attaining the selected support, in the curve's millimetre chart. */
    point: V;

    /** Angular span index plus its local Bernstein parameter. */
    phase: number;
  } {
    const g: V = unit(g0);
    let best: number = -Infinity;
    let result: { point: V; phase: number } = { point: [0, 0, 0], phase: 0 };
    for (let i: number = 0; i < c.spans.length; i++) {
      const [a, b, cc, d]: S = c.spans[i]!;
      const aa: number = dot(
        add(add(mul(a, -1), mul(b, 3)), add(mul(cc, -3), d)),
        g,
      );
      const bb: number = dot(mul(add(sub(a, mul(b, 2)), cc), 2), g);
      const dd: number = dot(sub(b, a), g);
      const roots: number[] = [];
      if (aa !== 0) {
        const discriminant: number = bb * bb - 4 * aa * dd;
        if (discriminant >= 0)
          roots.push(
            (-bb + Math.sqrt(discriminant)) / (2 * aa),
            (-bb - Math.sqrt(discriminant)) / (2 * aa),
          );
      } else if (bb !== 0) roots.push(-dd / bb);
      for (const t of [
        0,
        1,
        ...roots.filter((x: number): boolean => x > 0 && x < 1),
      ]) {
        const point: V = bez(c.spans[i]!, t);
        const value: number = dot(point, g);
        if (value > best) {
          best = value;
          result = { point, phase: i + t };
        }
      }
    }
    return result;
  }

  /** Join corresponding section controls with a longitudinal cubic. h0/h1 are constant or per-control handle displacements, so endpoint derivatives with respect to normalized t are 3*h0 and 3*h1. */
  export function tensor(a: Curve, b: Curve, h0: V | S[], h1: V | S[]): Tensor {
    const lift: (h: V | S[], i: number, j: number) => V = (
      h: V | S[],
      i: number,
      j: number,
    ): V => (typeof h[0] === "number" ? (h as V) : (h as S[])[i]![j]!);
    return [
      a.spans,
      a.spans.map(
        (s: S, i: number): S =>
          s.map((p: V, j: number): V => add(p, lift(h0, i, j))) as S,
      ),
      b.spans.map(
        (s: S, i: number): S =>
          s.map((p: V, j: number): V => sub(p, lift(h1, i, j))) as S,
      ),
      b.spans,
    ];
  }

  /** Evaluate each tensor row at the same quarter-span angular phase to obtain one longitudinal cubic; guides and sections therefore share one generating family. */
  export function longitudinal(tensor: Tensor, p: number): S {
    return tensor.map(
      (row: S[]): V => phase({ name: "tensor", spans: row, closed: true }, p),
    ) as S;
  }

  /** Evaluate the longitudinal tensor at normalized t to obtain its closed four-span transverse section. */
  export function section(tensor: Tensor, t: number, name: string): Curve {
    return {
      name,
      closed: true,
      spans: tensor[0].map(
        (s: S, i: number): S =>
          s.map(
            (_: V, j: number): V =>
              bez(tensor.map((row: S[]): V => row[i]![j]!) as S, t),
          ) as S,
      ),
    };
  }

  /** Publish the same coefficients in millimetres with equal span intervals summing to one turn for closed courses or one normalized interval for open courses; no display sampling is performed. */
  export function primitive(c: Curve): C.Cubic {
    return {
      type: "cubicBezier",
      name: c.name,
      closed: c.closed,
      unit: "mm",
      phaseUnit: c.closed ? "turn" : "normalized",
      phaseIntervals: c.spans.map((): number => 1 / c.spans.length),
      spans: c.spans,
    };
  }
}
