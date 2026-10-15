import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";

/** Transport samples per spine segment; the frame between samples takes one more reflection step. */
const DENSITY: number = 64;

/**
 * Create the buffers of a spine of `count` points and the in-place compiler
 * of its curve, tangent and rotation-minimizing frames.
 *
 * `update` builds the centripetal Catmull-Rom spline through the points
 * (Yuksel, Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755),
 * continued straight beyond its ends through phantom points reflected from
 * the second and second-last points. Each segment is stored in its cubic
 * Hermite form, its end derivatives the spline's knot tangents
 * `(P_k - P_k-1) / d_k-1 - (P_k+1 - P_k-1) / (d_k-1 + d_k) + (P_k+1 - P_k) / d_k`
 * over the centripetal spacings `d` scaled by the segment's spacing, so
 * positions and tangents are closed forms. A declared end tangent replaces
 * the first or last derivative's direction and keeps its length. Within a
 * segment the parameter runs linearly from its start point's chord-length
 * share to its end point's. With frames, `update` then transports the first
 * axis, `normal` made perpendicular to the first tangent, by the double
 * reflection method of Wang, Juttler, Zheng and Liu (2008, ACM Trans. Graph.
 * 27(1):2), 64 steps per segment, each reflecting across the bisector plane
 * of the step's chord and then across the plane mapping the reflected tangent
 * onto the next; a frame between two table entries reflects once more from
 * the entry below.
 *
 * @param count Number of spine points, at least two.
 * @param frames Whether to build the frame table; a curve sampled for points only omits it.
 * @returns The transport, its arrays zero until written.
 * @throws Error when `count` is below two; and from `update` when a point, the normal or an end tangent is not finite, two consecutive points coincide, the path reverses at a point, the normal is parallel to the first tangent, or the tangent vanishes somewhere on the path.
 *
 * @evidence contracts/common.md#principled-implementation The centripetal Catmull-Rom spline interpolates the points without cusps or self-intersections within a segment, and double reflection is a published fourth-order rotation-minimizing frame integrator using only arithmetic and square roots, so it reproduces bit for bit across JavaScript engines.
 * @evidence contracts/common.md#clear-and-simple-design One spine implementation: `frameAutoMovieSweepSpine` wraps it in objects, and posed sweeps rewrite its arrays every frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A vanishing tangent or a normal along the tangent is refused instead of replaced by an arbitrary axis.
 * @evidence contracts/common.md#meaningful-documentation States the spline and its tangents, the end-tangent rule, the parameterization, the transport and its source, the table density and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For n points: `update` is O(n) for the curve plus 64 (n - 1) reflections for the table; a point or tangent query is O(n) to find its segment and a frame query adds one reflection; nothing allocates after creation.
 * @evidence contracts/performance.md#reuse-equivalent-work The segment coefficients and frame table are computed once per `update` and serve every query until the next.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains 3 n input numbers, n knots, 12 (n - 1) coefficients and, with frames, 9 (64 (n - 1) + 1) table numbers, all sized at creation and released with the transport.
 */
export const transportAutoMovieSweepSpine: (
  count: number,
  frames: boolean,
) => IAutoMovieSweepTransport = (
  count: number,
  frames: boolean,
): IAutoMovieSweepTransport => {
  if (!(count >= 2)) throw new Error("sweep spine needs at least two points");
  const n: number = count;
  const points: Float64Array = new Float64Array(3 * n);
  const normal: Float64Array = new Float64Array(3);
  const start: Float64Array = new Float64Array(3);
  const end: Float64Array = new Float64Array(3);
  const knots: Float64Array = new Float64Array(n);
  // per segment: p0, p1, m0, m1
  const segments: Float64Array = new Float64Array(12 * (n - 1));
  const samples: number = DENSITY * (n - 1);
  // per entry: origin, first axis, normal
  const table: Float64Array = new Float64Array(frames ? 9 * (samples + 1) : 0);
  const scratch: Float64Array = new Float64Array(6);
  let length: number = 0;

  // the point k, or a phantom point beyond either end
  const at = (k: number, axis: number): number =>
    k < 0
      ? 2 * points[axis]! - points[3 + axis]!
      : k >= n
        ? 2 * points[3 * (n - 1) + axis]! - points[3 * (n - 2) + axis]!
        : points[3 * k + axis]!;
  // centripetal spacing: the square root of a chord, phantom chords included
  const spacing = (k: number): number =>
    Math.sqrt(
      Math.hypot(
        at(k + 1, 0) - at(k, 0),
        at(k + 1, 1) - at(k, 1),
        at(k + 1, 2) - at(k, 2),
      ),
    );
  // the spline's derivative at point k per unit of centripetal parameter, one axis
  const slope = (
    k: number,
    axis: number,
    before: number,
    after: number,
  ): number =>
    (at(k, axis) - at(k - 1, axis)) / before -
    (at(k + 1, axis) - at(k - 1, axis)) / (before + after) +
    (at(k + 1, axis) - at(k, axis)) / after;
  // a declared end direction replaces the derivative's own and keeps its speed
  const steer = (base: number, direction: Float64Array, what: string): void => {
    const size: number = Math.hypot(
      direction[0]!,
      direction[1]!,
      direction[2]!,
    );
    if (size === 0) return;
    if (!Number.isFinite(size))
      throw new Error(
        `sweep spine ${what} tangent must be finite and not zero`,
      );
    const speed: number = Math.hypot(
      segments[base]!,
      segments[base + 1]!,
      segments[base + 2]!,
    );
    for (let a: number = 0; a < 3; ++a)
      segments[base + a] = (direction[a]! * speed) / size;
  };
  const locate = (c: number): number => {
    let k: number = 0;
    while (k < n - 2 && knots[k + 1]! <= c) ++k;
    return k;
  };
  const clamp = (u: number): number => Math.min(1, Math.max(0, u));
  const point = (u: number, out: Float64Array, offset: number): void => {
    const c: number = clamp(u);
    const k: number = locate(c);
    const s: number = (c - knots[k]!) / (knots[k + 1]! - knots[k]!);
    const g: number = 12 * k;
    if (s === 0 || s === 1) {
      for (let a: number = 0; a < 3; ++a)
        out[offset + a] = segments[g + (s === 0 ? 0 : 3) + a]!;
      return;
    }
    const s2: number = s * s;
    const s3: number = s2 * s;
    const h00: number = 2 * s3 - 3 * s2 + 1;
    const h10: number = s3 - 2 * s2 + s;
    const h01: number = -2 * s3 + 3 * s2;
    const h11: number = s3 - s2;
    for (let a: number = 0; a < 3; ++a)
      out[offset + a] =
        segments[g + a]! * h00 +
        segments[g + 6 + a]! * h10 +
        (segments[g + 3 + a]! * h01 + segments[g + 9 + a]! * h11);
  };
  const tangent = (u: number, out: Float64Array, offset: number): void => {
    const c: number = clamp(u);
    const k: number = locate(c);
    const s: number = (c - knots[k]!) / (knots[k + 1]! - knots[k]!);
    const g: number = 12 * k;
    const s2: number = s * s;
    let size: number = 0;
    for (let a: number = 0; a < 3; ++a) {
      const d: number =
        segments[g + a]! * (6 * s2 - 6 * s) +
        segments[g + 6 + a]! * (3 * s2 - 4 * s + 1) +
        (segments[g + 3 + a]! * (-6 * s2 + 6 * s) +
          segments[g + 9 + a]! * (3 * s2 - 2 * s));
      out[offset + a] = d;
      size += d * d;
    }
    size = Math.sqrt(size);
    if (!(size > 0))
      throw new Error(`sweep spine tangent vanishes at u = ${c}`);
    for (let a: number = 0; a < 3; ++a)
      out[offset + a] = out[offset + a]! / size;
  };
  // the first axis carried from table entry i to a point with the given origin and normal, written at out[offset]
  const reflect = (
    i: number,
    origin: Float64Array,
    o: number,
    unit: Float64Array,
    t: number,
    out: Float64Array,
    offset: number,
  ): void => {
    const e: number = 9 * i;
    const v1x: number = origin[o]! - table[e]!;
    const v1y: number = origin[o + 1]! - table[e + 1]!;
    const v1z: number = origin[o + 2]! - table[e + 2]!;
    const c1: number = v1x * v1x + v1y * v1y + v1z * v1z;
    if (c1 === 0) {
      for (let a: number = 0; a < 3; ++a) out[offset + a] = table[e + 3 + a]!;
      return;
    }
    const kx: number =
      (2 / c1) *
      (v1x * table[e + 3]! + v1y * table[e + 4]! + v1z * table[e + 5]!);
    const xlx: number = table[e + 3]! - v1x * kx;
    const xly: number = table[e + 4]! - v1y * kx;
    const xlz: number = table[e + 5]! - v1z * kx;
    const kt: number =
      (2 / c1) *
      (v1x * table[e + 6]! + v1y * table[e + 7]! + v1z * table[e + 8]!);
    const v2x: number = unit[t]! - (table[e + 6]! - v1x * kt);
    const v2y: number = unit[t + 1]! - (table[e + 7]! - v1y * kt);
    const v2z: number = unit[t + 2]! - (table[e + 8]! - v1z * kt);
    const c2: number = v2x * v2x + v2y * v2y + v2z * v2z;
    const k2: number =
      c2 === 0 ? 0 : (2 / c2) * (v2x * xlx + v2y * xly + v2z * xlz);
    let x: number = xlx - v2x * k2;
    let y: number = xly - v2y * k2;
    let z: number = xlz - v2z * k2;
    // remove the rounding drift off the plane before the next step
    const along: number = x * unit[t]! + y * unit[t + 1]! + z * unit[t + 2]!;
    x -= unit[t]! * along;
    y -= unit[t + 1]! * along;
    z -= unit[t + 2]! * along;
    const size: number = Math.hypot(x, y, z);
    out[offset] = x / size;
    out[offset + 1] = y / size;
    out[offset + 2] = z / size;
  };

  const update = (): void => {
    for (let k: number = 0; k < 3 * n; ++k)
      if (!Number.isFinite(points[k]!))
        throw new Error(`sweep spine point ${Math.floor(k / 3)} is not finite`);
    if (
      !(
        Number.isFinite(normal[0]!) &&
        Number.isFinite(normal[1]!) &&
        Number.isFinite(normal[2]!)
      )
    )
      throw new Error("sweep spine normal is not finite");
    let total: number = 0;
    knots[0] = 0;
    for (let k: number = 1; k < n; ++k) {
      const ax: number = points[3 * k]! - points[3 * k - 3]!;
      const ay: number = points[3 * k + 1]! - points[3 * k - 2]!;
      const az: number = points[3 * k + 2]! - points[3 * k - 1]!;
      const chord: number = Math.hypot(ax, ay, az);
      if (chord === 0)
        throw new Error(`sweep spine points ${k - 1} and ${k} coincide`);
      total += chord;
      knots[k] = total;
      if (k >= 2) {
        const bx: number = points[3 * k - 3]! - points[3 * k - 6]!;
        const by: number = points[3 * k - 2]! - points[3 * k - 5]!;
        const bz: number = points[3 * k - 1]! - points[3 * k - 4]!;
        // a path reversing at a point has no direction there
        if (
          bx * ax + by * ay + bz * az <=
          -(1 - 1e-12) * Math.hypot(bx, by, bz) * chord
        )
          throw new Error(`sweep spine doubles back at point ${k - 1}`);
      }
    }
    length = total;
    for (let k: number = 0; k < n; ++k) knots[k] = knots[k]! / total;
    for (let k: number = 0; k + 1 < n; ++k) {
      const span: number = spacing(k);
      const g: number = 12 * k;
      const b0: number = spacing(k - 1);
      const b1: number = spacing(k + 1);
      for (let a: number = 0; a < 3; ++a) {
        segments[g + a] = at(k, a);
        segments[g + 3 + a] = at(k + 1, a);
        segments[g + 6 + a] = slope(k, a, b0, span) * span;
        segments[g + 9 + a] = slope(k + 1, a, span, b1) * span;
      }
    }
    steer(6, start, "start");
    steer(12 * (n - 2) + 9, end, "end");
    if (!frames) return;
    tangent(0, scratch, 3);
    const dot: number =
      normal[0]! * scratch[3]! +
      normal[1]! * scratch[4]! +
      normal[2]! * scratch[5]!;
    const fx: number = normal[0]! - scratch[3]! * dot;
    const fy: number = normal[1]! - scratch[4]! * dot;
    const fz: number = normal[2]! - scratch[5]! * dot;
    const size: number = Math.hypot(fx, fy, fz);
    if (
      !(
        size >
        1e-9 * Math.max(1, Math.hypot(normal[0]!, normal[1]!, normal[2]!))
      )
    )
      throw new Error(
        "sweep spine normal must not be parallel to its first tangent",
      );
    point(0, table, 0);
    table[3] = fx / size;
    table[4] = fy / size;
    table[5] = fz / size;
    for (let a: number = 0; a < 3; ++a) table[6 + a] = scratch[3 + a]!;
    for (let i: number = 1; i <= samples; ++i) {
      const u: number = i / samples;
      const e: number = 9 * i;
      point(u, table, e);
      tangent(u, table, e + 6);
      reflect(i - 1, table, e, table, e + 6, table, e + 3);
    }
  };
  const frame = (u: number, out: Float64Array, offset: number): void => {
    if (!frames) throw new Error("this spine transport carries no frames");
    const c: number = clamp(u);
    const i: number = Math.min(samples, Math.floor(c * samples));
    point(c, out, offset);
    tangent(c, out, offset + 9);
    if (i / samples === c)
      for (let a: number = 0; a < 3; ++a)
        out[offset + 3 + a] = table[9 * i + 3 + a]!;
    else reflect(i, out, offset, out, offset + 9, out, offset + 3);
    // second axis: normal crossed with the first
    const nx: number = out[offset + 9]!;
    const ny: number = out[offset + 10]!;
    const nz: number = out[offset + 11]!;
    const xx: number = out[offset + 3]!;
    const xy: number = out[offset + 4]!;
    const xz: number = out[offset + 5]!;
    out[offset + 6] = ny * xz - nz * xy;
    out[offset + 7] = nz * xx - nx * xz;
    out[offset + 8] = nx * xy - ny * xx;
  };
  return {
    count: n,
    points,
    normal,
    start,
    end,
    update,
    length: (): number => length,
    point,
    tangent,
    frame,
  };
};
