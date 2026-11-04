import type { IAutoMovieHumanSeam } from "./IAutoMovieHumanSeam";

/**
 * The shared joining mathematics of divided parts: how an owner publishes a
 * seam's jet, how a neighbour copies it, and how a seam is measured.
 *
 * - J1, curves: the owner publishes `(p, T, kappa N)` by arclength
 *   ({@link publish}); a neighbour of parameter speed `lambda` and tangential
 *   acceleration `mu` writes `q_v = lambda T`, `q_vv = lambda^2 kappa N + mu T`
 *   ({@link adopt}). The curve so copied has the owner's point, tangent line
 *   and curvature vector whatever `lambda > 0` and `mu`: the curvature of a
 *   parametric curve is the part of `q_vv` across `q_v` over `|q_v|^2`.
 * - J4, surface ribbons: across a seam curve `c(t)` with the owner's cross
 *   derivatives `D1`, `D2` and `d_t D1`, a neighbour leaves along
 *   `q_w = alpha D1 + beta c'` (G1 for `alpha > 0`, since it stays in the
 *   owner's tangent plane) and bends by
 *   `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''` (G2: its normal
 *   part is the owner's second fundamental form in that direction, the chain
 *   rule of `P(t + beta w, w alpha)`); see {@link ribbon}.
 * - J6, reflection: a mirrored piece mirrors every vector and reverses its
 *   along parameter, so `along` and `twist` change sign and the outward
 *   orientation is kept ({@link reflect}).
 * - J8, observation: gap, normal angle and the jump of normal curvature in
 *   the plane normal to the seam's tangent ({@link measure}).
 *
 * Knot jets and sector assembly (J2) live in `AutoMovieHumanSeamKnot`, and
 * the station rule along a chain (J3) in `AutoMovieHumanSeamStation`.
 * Vectors are plain arrays of any dimension unless a function says 3.
 */
export namespace AutoMovieHumanSeam {
  /** Readings of one seam point: what the declared continuity is judged on. */
  export interface IMeasure {
    /** Distance between the two pieces' points, mm. */
    gap: number;

    /** Angle between tangents (curves) or normals (surfaces), radians. */
    angle: number;

    /** Jump of the curvature vector (curves) or of the normal curvature across the seam (surfaces), 1/mm. */
    curvature: number;
  }

  /** Largest readings a declared continuity accepts. */
  export interface ITolerance {
    /** Largest gap, mm. */
    gap: number;

    /** Largest angle, radians. */
    angle: number;

    /** Largest curvature jump, 1/mm. */
    curvature: number;
  }

  /**
   * Unit tangent and curvature vector of a curve from its first and second
   * derivatives in any parameter: `T = d1 / |d1|` and
   * `kappa N = (d2 - (d2 . T) T) / |d1|^2`.
   *
   * A zero first derivative is read as speed 1, so a degenerate end yields a
   * zero tangent rather than NaN. The operation order is the one the
   * appendage strip has always used, so its rows are unchanged bit for bit.
   *
   * @param d1 First derivative.
   * @param d2 Second derivative, in the same parameter.
   * @returns `[T, kappa N]`.
   */
  export function arc(
    d1: readonly number[],
    d2: readonly number[],
  ): [number[], number[]] {
    const speed: number = Math.hypot(...d1) || 1;
    const T: number[] = scale(d1, 1 / speed);
    const along: number = dot(d2, T) / speed;
    return [
      T,
      scale(
        d2.map((v: number, k: number): number => v + T[k]! * (-along * speed)),
        1 / (speed * speed),
      ),
    ];
  }

  /**
   * The jet an owner publishes for a curve point (J1): its point, unit
   * tangent and curvature vector, free of the owner's parameter.
   *
   * @param point Point, mm.
   * @param d1 First derivative in the owner's parameter.
   * @param d2 Second derivative in the owner's parameter.
   */
  export function publish(
    point: readonly number[],
    d1: readonly number[],
    d2: readonly number[],
  ): IAutoMovieHumanSeam.IArcJet {
    const [tangent, curvature] = arc(d1, d2);
    return { point: [...point], tangent, curvature };
  }

  /**
   * A neighbour's parametric jet copied from an owner's arclength jet (J1):
   * `q_v = lambda T` and `q_vv = lambda^2 kappa N + mu T`.
   *
   * `lambda` is the neighbour's speed in mm per unit of its own parameter at
   * the seam, `mu` its tangential acceleration; neither changes the geometry
   * the neighbour meets, only how its parameter runs through it.
   *
   * @param jet The owner's published jet.
   * @param lambda Parameter speed; positive for a regular copy, 0 only where
   *   the neighbour itself degenerates to a point (a zero-length strip edge).
   * @param mu Tangential acceleration; 0 leaves `q_vv` across the tangent.
   * @returns `[q, q_v, q_vv]`.
   */
  export function adopt(
    jet: IAutoMovieHumanSeam.IArcJet,
    lambda: number,
    mu: number = 0,
  ): [number[], number[], number[]] {
    // A negative speed would run the neighbour back into the owner.
    if (!(lambda >= 0))
      throw new Error(`A copied jet needs a speed of at least 0, not ${lambda}`);
    const first: number[] = scale(jet.tangent, lambda);
    const bend: number[] = scale(jet.curvature, lambda * lambda);
    return [
      [...jet.point],
      first,
      mu === 0
        ? bend
        : bend.map((v: number, k: number): number => v + mu * jet.tangent[k]!),
    ];
  }

  /**
   * Cross derivatives of a ribbon leaving an owner's surface across a seam
   * (J4): `q_w = alpha D1 + beta c'` and
   * `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''`.
   *
   * @param owner The owner's jet at the seam point: `along` is `c'`,
   *   `alongSecond` `c''`, `across` `D1`, `acrossSecond` `D2`, `twist` `d_t D1`.
   * @param alpha Share of the owner's cross derivative, positive so the
   *   ribbon leaves the owner instead of folding back into it.
   * @param beta Share of the seam's own tangent, the ribbon's lean along it.
   * @returns `[q_w, q_ww]`.
   */
  export function ribbon(
    owner: IAutoMovieHumanSeam.ISurfaceJet,
    alpha: number,
    beta: number,
  ): [number[], number[]] {
    if (!(alpha > 0))
      throw new Error(`A ribbon needs a positive cross share, not ${alpha}`);
    return [
      owner.across.map(
        (v: number, k: number): number => alpha * v + beta * owner.along[k]!,
      ),
      owner.acrossSecond.map(
        (v: number, k: number): number =>
          alpha * alpha * v +
          2 * alpha * beta * owner.twist[k]! +
          beta * beta * owner.alongSecond[k]!,
      ),
    ];
  }

  /**
   * A chart direction leaving a curve on a surface square to it on the skin
   * (J4 in the surface's chart): `w = D1 + beta c'` with
   * `beta = -<D1, c'> / <c', c'>` in the first fundamental form
   * `[E, F, G]` of the chart's two coordinates, so `w` is `D1` with its part
   * along the curve removed in the metric of the skin, not of the chart.
   *
   * A chart whose coordinates differ in scale (phase in radians against
   * station in mm) turns a direction square in the chart far off square on
   * the skin; near where the curve runs along one coordinate the turned
   * direction then swings through a right angle within a tiny step. Here
   * `alpha = 1` keeps `w` on `D1`'s side of the curve.
   *
   * @param metric `[E, F, G]`: dot products of the surface's derivatives
   *   along the first and second chart coordinates.
   * @param cross `D1`, a chart direction across the curve on the side to leave toward.
   * @param along `c'`, the curve's chart tangent.
   * @returns `w` in the same chart coordinates.
   */
  export function square(
    metric: readonly [number, number, number],
    cross: readonly [number, number],
    along: readonly [number, number],
  ): [number, number] {
    const [E, F, G] = metric;
    const inner = (a: readonly [number, number], b: readonly [number, number]): number =>
      E * a[0] * b[0] + F * (a[0] * b[1] + a[1] * b[0]) + G * a[1] * b[1];
    const length: number = inner(along, along);
    const beta: number = length > 0 ? -inner(cross, along) / length : 0;
    return [cross[0] + beta * along[0], cross[1] + beta * along[1]];
  }

  /**
   * A surface jet mirrored across a coordinate plane (J6): every vector's
   * `axis` component changes sign, and `along` and `twist` change sign as
   * well, because the mirrored piece runs its along parameter backward to
   * keep its outward orientation.
   *
   * @param jet Jet of the canonical side.
   * @param axis Mirrored coordinate, 2 for the body's lateral `z`.
   */
  export function reflect(
    jet: IAutoMovieHumanSeam.ISurfaceJet,
    axis: number = 2,
  ): IAutoMovieHumanSeam.ISurfaceJet {
    const mirror = (v: readonly number[], sign: number): number[] =>
      v.map((x: number, k: number): number => (k === axis ? -x : x) * sign);
    return {
      point: mirror(jet.point, 1),
      along: mirror(jet.along, -1),
      alongSecond: mirror(jet.alongSecond, 1),
      across: mirror(jet.across, 1),
      acrossSecond: mirror(jet.acrossSecond, 1),
      twist: mirror(jet.twist, -1),
    };
  }

  /**
   * Readings between two curve pieces meeting at a point: gap, angle between
   * their unit tangents and the length of the difference of their curvature
   * vectors. Both jets run in the same direction through the point.
   */
  export function measureArc(
    before: IAutoMovieHumanSeam.IArcJet,
    after: IAutoMovieHumanSeam.IArcJet,
  ): IMeasure {
    return {
      gap: norm(sub(after.point, before.point)),
      angle: angle(before.tangent, after.tangent),
      curvature: norm(sub(after.curvature, before.curvature)),
    };
  }

  /**
   * Readings between an owner's and a neighbour's surface at one seam point
   * (J8): gap, angle between the normals `along x across`, and the jump of
   * normal curvature in the plane normal to the seam's tangent.
   *
   * The normal curvature in the unit direction `w` across the seam in the
   * tangent plane is the second fundamental form there,
   * `a^2 L + 2 a b M + b^2 N` with `w = a P_along + b P_across` and
   * `L, M, N` the second derivatives' normal components; it depends on the
   * surface alone, not on how either piece parameterises it. Both jets must
   * run `along` the same way and `across` away from the owner, so normals
   * that agree mean a shared tangent plane and opposite ones a fold. 3D only.
   */
  export function measure(
    owner: IAutoMovieHumanSeam.ISurfaceJet,
    neighbour: IAutoMovieHumanSeam.ISurfaceJet,
  ): IMeasure {
    const n0: number[] = normalOf(owner);
    const n1: number[] = normalOf(neighbour);
    return {
      gap: norm(sub(neighbour.point, owner.point)),
      angle: angle(n0, n1),
      curvature: Math.abs(across(neighbour, n1) - across(owner, n0)),
    };
  }

  /**
   * What a reading fails of its declared continuity: one line per failed
   * order, empty when the seam holds. G0 judges the gap, G1 the angle as
   * well, G2 the curvature jump as well.
   */
  export function violations(
    reading: IMeasure,
    continuity: IAutoMovieHumanSeam.Continuity,
    tolerance: ITolerance,
  ): string[] {
    const out: string[] = [];
    if (reading.gap > tolerance.gap)
      out.push(`gap ${reading.gap} mm > ${tolerance.gap} mm`);
    if (continuity !== "G0" && reading.angle > tolerance.angle)
      out.push(`angle ${reading.angle} rad > ${tolerance.angle} rad`);
    if (continuity === "G2" && reading.curvature > tolerance.curvature)
      out.push(`curvature jump ${reading.curvature} /mm > ${tolerance.curvature} /mm`);
    return out;
  }

  /**
   * Tolerance of a seam that is copied, not approximated, at a length scale:
   * a billionth of the scale for the gap, a billionth of a radian for the
   * angle and a billionth over the scale for the curvature. Copying runs a
   * few dozen double operations, so rounding stays near 1e-14 of the scale;
   * the limits sit five orders above it and far below any modelled feature.
   *
   * @param scale Length of the piece, mm.
   */
  export function exact(scale: number): ITolerance {
    return { gap: 1e-9 * scale, angle: 1e-9, curvature: 1e-9 / scale };
  }

  /**
   * The normal component of the mismatch between a parent's and a child's
   * derivative leaving a shared ring, `N . (D_p - D_c)`: the change a G1 join
   * must give the child's derivative along the ring's normal. The event join
   * divides it by `N . m`, the in-plane normal's share of `N`, for the
   * smallest in-plane change that meets the parent's tangent plane. 3D only.
   */
  export function defect(
    N: readonly number[],
    parent: readonly number[],
    child: readonly number[],
  ): number {
    return (
      N[0]! * (parent[0]! - child[0]!) +
      N[1]! * (parent[1]! - child[1]!) +
      N[2]! * (parent[2]! - child[2]!)
    );
  }

  /**
   * Quintic Hermite span between two owners' jets in one shared parameter:
   * each end's value, first and second derivative per unit of that parameter
   * (`[value, d1, d2]`, any dimension), the span `h` long, read at `u` in
   * `[0, 1]`. It reproduces both jets exactly, so the span is C2 to both
   * owners whatever they are (a J1 or J3 copy at the owners' own speed); a
   * jet whose second derivative is zero is a natural end. Outside `[0, 1]`
   * it holds the end values.
   *
   * @param lo The lower owner's jet at `u = 0`.
   * @param hi The upper owner's jet at `u = 1`.
   * @param h Length of the span in the jets' parameter.
   * @param u Place in the span.
   */
  export function quintic(
    lo: readonly (readonly number[])[],
    hi: readonly (readonly number[])[],
    h: number,
    u: number,
  ): number[] {
    const t: number = Math.min(1, Math.max(0, u));
    const t2: number = t * t;
    const t3: number = t2 * t;
    const t4: number = t3 * t;
    const t5: number = t4 * t;
    const a0: number = 1 - 10 * t3 + 15 * t4 - 6 * t5;
    const a1: number = h * (t - 6 * t3 + 8 * t4 - 3 * t5);
    const a2: number = h * h * 0.5 * (t2 - 3 * t3 + 3 * t4 - t5);
    const b2: number = h * h * 0.5 * (t3 - 2 * t4 + t5);
    const b1: number = h * (-4 * t3 + 7 * t4 - 3 * t5);
    const b0: number = 10 * t3 - 15 * t4 + 6 * t5;
    return lo[0]!.map(
      (v: number, k: number): number =>
        a0 * v +
        a1 * lo[1]![k]! +
        a2 * lo[2]![k]! +
        b2 * hi[2]![k]! +
        b1 * hi[1]![k]! +
        b0 * hi[0]![k]!,
    );
  }

  /**
   * Cubic Hermite from `a` to `b` with end derivatives `ta`, `tb` at unit
   * parameter u: the G1 column a web or strip draws between two pieces when
   * each end derivative is a copied `lambda T`.
   */
  export function hermite(
    a: readonly number[],
    ta: readonly number[],
    b: readonly number[],
    tb: readonly number[],
    u: number,
  ): number[] {
    const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = u ** 3 - 2 * u ** 2 + u;
    const h01: number = -2 * u ** 3 + 3 * u ** 2;
    const h11: number = u ** 3 - u ** 2;
    return a.map(
      (_: number, k: number): number =>
        h00 * a[k]! + h10 * ta[k]! + h01 * b[k]! + h11 * tb[k]!,
    );
  }
}

/** Unit normal `along x across` of a surface jet, 3D. */
function normalOf(jet: IAutoMovieHumanSeam.ISurfaceJet): number[] {
  const a: readonly number[] = jet.along;
  const c: readonly number[] = jet.across;
  const n: number[] = [
    a[1]! * c[2]! - a[2]! * c[1]!,
    a[2]! * c[0]! - a[0]! * c[2]!,
    a[0]! * c[1]! - a[1]! * c[0]!,
  ];
  return scale(n, 1 / (norm(n) || 1));
}

/**
 * Normal curvature of a surface jet in the unit tangent direction across its
 * seam, `w = (across - (across . T) T) / |...|`, read against normal n.
 */
function across(jet: IAutoMovieHumanSeam.ISurfaceJet, n: readonly number[]): number {
  const speed: number = norm(jet.along) || 1;
  const T: number[] = scale(jet.along, 1 / speed);
  const lean: number = dot(jet.across, T);
  const q: number[] = jet.across.map((v: number, k: number): number => v - lean * T[k]!);
  const b: number = 1 / (norm(q) || 1);
  const a: number = -lean * b / speed;
  return (
    a * a * dot(jet.alongSecond, n) +
    2 * a * b * dot(jet.twist, n) +
    b * b * dot(jet.acrossSecond, n)
  );
}

/** Angle between two directions, accurate near 0 and pi. */
function angle(a: readonly number[], b: readonly number[]): number {
  const u: number[] = scale(a, 1 / (norm(a) || 1));
  const v: number[] = scale(b, 1 / (norm(b) || 1));
  return 2 * Math.atan2(norm(sub(u, v)), norm(u.map((x: number, k: number): number => x + v[k]!)));
}

/** Dot product, summed from the first term in index order. */
function dot(a: readonly number[], b: readonly number[]): number {
  let s: number = a[0]! * b[0]!;
  for (let k: number = 1; k < a.length; k++) s += a[k]! * b[k]!;
  return s;
}

/** Difference. */
function sub(a: readonly number[], b: readonly number[]): number[] {
  return a.map((v: number, k: number): number => v - b[k]!);
}

/** Scalar multiple. */
function scale(a: readonly number[], s: number): number[] {
  return a.map((v: number): number => v * s);
}

/** Euclidean length. */
function norm(a: readonly number[]): number {
  return Math.hypot(...a);
}
