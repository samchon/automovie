import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Generate a relaxed convex enclosing section from independent breadth, depth
 * and skin perimeter. This is a symmetric engineering family, not an anatomical
 * conversion or a fitted population relation. Paired masses and recesses need
 * separate exterior constraints; their convex-tape perimeter is not this skin
 * arclength. The caller supplies one admitted physical section frame.
 *
 * Eight quadratic arcs retain the four cardinal extrema and share tangents.
 * Exact degree elevation stores those same arcs as cubic coefficients. A single
 * rounding degree of freedom is solved without changing breadth or depth.
 * Its regular support lies strictly between the inscribed diamond and bounding
 * rectangle perimeters. Unsupported quantities refuse this family, not a person.
 * Numerical quadrature agreement and the perimeter residual are observations,
 * not an outward-rounded integration certificate or measurement accuracy.
 */
export function generateAutoMovieHumanSection64(props: {
  /** Semantic section identity, shared with its physical station. */
  name: string;
  /** Full relaxed transverse breadth, millimetres. */
  breadthMm: number;
  /** Full relaxed anterior/posterior depth, millimetres. */
  depthMm: number;
  /** Skin arclength of this convex section, millimetres. */
  perimeterMm: number;
  /** Owning section centre in the common rest frame, millimetres. */
  centreMm: C.Vector;
  /** Admitted unit breadth axis of that physical measurement plane. */
  breadthAxis: C.Vector;
  /** Admitted orthogonal unit anterior axis of that plane. */
  anteriorAxis: C.Vector;
}): {
  curve: C.Cubic;
  rounding: number;
  observedPerimeterMm: number;
  perimeterResidualMm: number;
  quadratureAgreementMm: number;
  numericalToleranceMm: number;
} {
  const B: number = props.breadthMm;
  const D: number = props.depthMm;
  const G: number = props.perimeterMm;
  const lower: number = 2 * Math.hypot(B, D);
  const upper: number = 2 * (B + D);
  if (
    ![B, D, G, lower, upper].every(Number.isFinite) ||
    !(B > 0 && D > 0 && G > lower && G < upper)
  )
    throw new Error(
      `${props.name}: unsupported convex section; require positive independent breadth/depth and perimeter strictly between 2*hypot(B,D) and 2*(B+D)`,
    );
  if (
    ![...props.centreMm, ...props.breadthAxis, ...props.anteriorAxis].every(
      Number.isFinite,
    )
  )
    throw new Error(`${props.name}: finite section frame required`);
  const dot: number = props.breadthAxis.reduce(
    (sum: number, x: number, k: number): number =>
      sum + x * props.anteriorAxis[k]!,
    0,
  );
  if (
    Math.abs(Math.hypot(...props.breadthAxis) - 1) > 64 * Number.EPSILON ||
    Math.abs(Math.hypot(...props.anteriorAxis) - 1) > 64 * Number.EPSILON ||
    Math.abs(dot) > 64 * Number.EPSILON
  )
    throw new Error(`${props.name}: orthonormal physical section axes required`);
  const a: number = B / 2;
  const b: number = D / 2;
  const tolerance: number = 1e-9 * Math.max(B, D, G, 1);
  /** Composite Simpson sums on the two quadrant arcs; no geometry sampling supplies controls. */
  function sum(d: number, panels: number): number {
    let result: number = 0;
    for (let i: number = 0; i <= panels; ++i) {
      const t: number = i / panels;
      const dx: number = 2 * (1 - d) * t;
      const dz: number = 2 * (2 * d - 1) + 2 * (2 - 3 * d) * t;
      const weight: number = i === 0 || i === panels ? 1 : i % 2 ? 4 : 2;
      result += weight * (Math.hypot(a * dx, b * dz) + Math.hypot(b * dx, a * dz));
    }
    return (4 * result) / (3 * panels);
  }
  /** Stop on successive full-perimeter quadrature agreement, within an explicit work limit. */
  function measure(d: number): { length: number; agreement: number } {
    let previous: number = sum(d, 2);
    for (let panels: number = 4; panels <= 4096; panels *= 2) {
      const length: number = sum(d, panels);
      const agreement: number = Math.abs(length - previous);
      if (agreement <= tolerance / 8) return { length, agreement };
      previous = length;
    }
    throw new Error(`${props.name}: section arclength quadrature unresolved`);
  }
  let lo: number = 0.5;
  let hi: number = 1;
  let rounding: number = 0.75;
  let observed: { length: number; agreement: number } = measure(rounding);
  for (let iteration: number = 0; iteration < 56; ++iteration) {
    rounding = (lo + hi) / 2;
    observed = measure(rounding);
    if (Math.abs(observed.length - G) <= tolerance / 2) break;
    if (observed.length < G) lo = rounding;
    else hi = rounding;
  }
  if (
    !(rounding > 0.5 && rounding < 1) ||
    Math.abs(observed.length - G) > tolerance
  )
    throw new Error(`${props.name}: independent section perimeter unresolved`);
  /** Place a mathematical section coordinate in its owning physical frame. */
  function place(x: number, z: number): C.Vector {
    return [0, 1, 2].map(
      (k: number): number =>
        props.centreMm[k]! +
        a * x * props.breadthAxis[k]! +
        b * z * props.anteriorAxis[k]!,
    ) as unknown as C.Vector;
  }
  /** Quarter turns act before anisotropic physical scaling; these are algebraic symmetries, not specimen controls. */
  function rotate(x: number, z: number, quarter: number): [number, number] {
    return quarter === 0
      ? [x, z]
      : quarter === 1
        ? [-z, x]
        : quarter === 2
          ? [-x, -z]
          : [z, -x];
  }
  const spans: C.Span[] = [];
  for (let quarter: number = 0; quarter < 4; ++quarter) {
    const diagonal: number = rounding;
    const tangent: number = 2 * rounding - 1;
    const arcs: [number, number][][] = [
      [[1, 0], [1, tangent], [diagonal, diagonal]],
      [[diagonal, diagonal], [tangent, 1], [0, 1]],
    ];
    for (const arc of arcs) {
      const q: C.Vector[] = arc.map(
        ([x, z]: [number, number]): C.Vector => {
          const [u, v]: [number, number] = rotate(x, z, quarter);
          return place(u, v);
        },
      );
      const elevate: (end: C.Vector, middle: C.Vector) => C.Vector = (
        end: C.Vector,
        middle: C.Vector,
      ): C.Vector => [0, 1, 2].map(
        (k: number): number => end[k]! / 3 + (2 * middle[k]!) / 3,
      ) as unknown as C.Vector;
      spans.push([q[0]!, elevate(q[0]!, q[1]!), elevate(q[2]!, q[1]!), q[2]!]);
    }
  }
  return {
    curve: {
      type: "cubicBezier",
      name: props.name,
      closed: true,
      unit: "mm",
      phaseUnit: "turn",
      phaseIntervals: Array.from({ length: 8 }, (): number => 1 / 8),
      spans,
    },
    rounding,
    observedPerimeterMm: observed.length,
    perimeterResidualMm: observed.length - G,
    quadratureAgreementMm: observed.agreement,
    numericalToleranceMm: tolerance,
  };
}
