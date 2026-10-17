import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Vector and exact cubic arithmetic in the native subject-left/up/front chart. Point coordinates use mm; derivative/handle vectors retain the units stated by the caller. Functions allocate results except where a caller edits the returned mutable control arrays. No conversion to sampled Catmull-Rom waypoints occurs.
 *
 * @author Samchon
 */
export namespace FaceMath {
  /** Mutable ordered X/Y/Z triple. Position units are mm; field derivatives use the enclosing longitudinal units. */
  export type V = [number, number, number];

  /** Mutable cubic Bernstein controls in P0/P1/P2/P3 order; P1 and P2 are handles, not interpolation knots. */
  export type S = [V, V, V, V];

  /** Native cubic course with explicit per-span parameter widths. When all width fields are absent, publication uses equal normalized widths for open courses and equal turn widths for closed courses.
   *
   * @author Samchon
   */
  export interface Curve {
    /** Semantic identifier preserved when the course becomes a public primitive. */
    name: string;

    /** Whether the last span reconnects to the first; no regularity or nonintersection certificate is implied. */
    closed: boolean;

    /** Ordered mutable cubic Bernstein controls in native coordinates. */
    spans: S[];

    /** Optional positive longitudinal-mm duration per span; takes precedence over other phase descriptions during publication. */
    lengthsMm?: number[];

    /** Optional signed angular sweep per span. Publication uses its absolute value divided by 2*pi as turn duration; control order retains direction. */
    signedRadians?: number[];

    /** Optional dimensionless duration per span, used when no physical or angular duration is present. */
    normalizedWidths?: number[];
  }

  /** Quarter-circle cubic handle ratio 4*(sqrt(2)-1)/3, obtained from the symmetric tangent construction. Scaling axes gives an ellipse approximation, not an exact conic. */
  export const K: number = (4 * (Math.sqrt(2) - 1)) / 3;

  /** Copy the first three ordered components without validation or unit conversion. The caller must supply a three-component vector. */
  export function vec(p: readonly number[]): V {
    return [p[0]!, p[1]!, p[2]!];
  }

  /** Return a + s*b in a common chart. The default dimensionless multiplier is 1; no parent transform or normalization is applied. */
  export function add(a: C.Vector, b: C.Vector, s: number = 1): V {
    return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
  }

  /** Multiply every vector component by the supplied scalar. Its physical units multiply those of the input. */
  export function mul(a: C.Vector, s: number): V {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Euclidean magnitude of a three-component vector, in the input vector unit. */
  export function norm(a: C.Vector): number {
    return Math.hypot(...a);
  }

  /** Evaluate four cubic Bernstein controls at dimensionless t. The caller supplies four points and normally 0<=t<=1; extrapolation is not rejected. */
  export function bezier(p: readonly C.Vector[], t: number): V {
    return [0, 1, 2].map(
      (k: number): number =>
        (1 - t) ** 3 * p[0]![k]! +
        3 * (1 - t) ** 2 * t * p[1]![k]! +
        3 * (1 - t) * t * t * p[2]![k]! +
        t ** 3 * p[3]![k]!,
    ) as V;
  }

  /** Construct neighbor-chord handle offsets, then emit Bernstein spans through the knots. rounding defaults to 1/6 of the two-neighbor chord; endpoints use reflected neighbors. cardinal pins the four cardinal tangent directions of a twelve-knot section and uses 0.4 of the shorter adjacent chord as a shape convention.
   *
   * @param name Semantic output identifier.
   * @param p Ordered native knots; open courses need at least two.
   * @param closed Whether the final knot connects back to the first.
   * @param cardinal Whether twelve-knot section cardinal handles receive fixed axes.
   * @param rounding Dimensionless neighbor-chord handle fraction.
   * @returns Mutable native spans with handle offsets already applied.
   */
  export function curve(
    name: string,
    p: readonly C.Vector[],
    closed: boolean = false,
    cardinal: boolean = false,
    rounding: number = 1 / 6,
  ): Curve {
    const tangents: V[] = p.map((point: C.Vector, i: number): V => {
      const before: C.Vector =
        i || closed
          ? p[(i - 1 + p.length) % p.length]!
          : add(p[0]!, add(p[1]!, p[0]!, -1), -1);
      const after: C.Vector =
        i < p.length - 1 || closed
          ? p[(i + 1) % p.length]!
          : add(p.at(-1)!, add(p.at(-1)!, p.at(-2)!, -1));
      if (cardinal && [0, 3, 6, 9].includes(i)) {
        const directions: V[] = [
          [1, 0, 0],
          [0, 0, -1],
          [-1, 0, 0],
          [0, 0, 1],
        ];
        return mul(
          directions[i / 3]!,
          Math.min(norm(add(point, before, -1)), norm(add(after, point, -1))) *
            0.4,
        );
      }
      return mul(add(after, before, -1), rounding);
    });
    return hermite(name, p, tangents, closed, 1);
  }

  /** Convert knot/tangent pairs into cubic controls: P1=P0+tangent0/divisor and P2=P3-tangent1/divisor. With divisor=3 the inputs are derivatives over a unit span; divisor=1 interprets them as handle offsets. Width scaling is the caller's responsibility. Matching shared tangent entries gives equal local derivatives.
   *
   * @param name Semantic output identifier.
   * @param p Ordered endpoints, in a common chart.
   * @param tangents One same-unit tangent or handle vector per endpoint.
   * @param closed Connect the last endpoint to the first when true.
   * @param divisor Positive derivative-to-handle divisor, conventionally 3 or 1.
   * @returns Ordered exact cubic controls; no resampling or tangent normalization.
   */
  export function hermite(
    name: string,
    p: readonly C.Vector[],
    tangents: readonly C.Vector[],
    closed: boolean = false,
    divisor: number = 3,
  ): Curve {
    const spans: S[] = [];
    for (let i: number = 0; i < p.length - (closed ? 0 : 1); i++) {
      const j: number = (i + 1) % p.length;
      spans.push([
        vec(p[i]!),
        add(p[i]!, tangents[i]!, 1 / divisor),
        add(p[j]!, tangents[j]!, -1 / divisor),
        vec(p[j]!),
      ]);
    }
    return { name, closed, spans };
  }

  /** Interpolate strictly ascending or descending physical-Y stations. Interior X/Z slopes use the smaller same-sign neighboring secant or zero at a sign change; Y slope is 1. Multiplying slopes by signed deltaY/3 gives cubic handles while published span durations retain abs(deltaY) mm. This limiter is a shape choice, not a general monotone-spline or physiological certificate.
   *
   * @param name Course identifier included in ordering errors.
   * @param p At least two strictly ordered native-mm knots.
   * @param start Optional first derivative d(position)/d(nativeY), mm/mm.
   * @param end Optional last derivative in the same units.
   * @returns Open native course parameterized by cumulative longitudinal mm.
   * @throws Error when Y has zero intervals or changes ordering direction.
   */
  export function station(
    name: string,
    p: readonly C.Vector[],
    start?: C.Vector,
    end?: C.Vector,
  ): Curve {
    const dy: number[] = p
      .slice(1)
      .map((q: C.Vector, i: number): number => q[1] - p[i]![1]);
    if (
      !dy.length ||
      !(
        dy.every((d: number): boolean => d > 0) ||
        dy.every((d: number): boolean => d < 0)
      )
    )
      throw new Error("Ordered physical-Y stations required: " + name);
    const slopes: V[] = dy.map(
      (d: number, i: number): V => mul(add(p[i + 1]!, p[i]!, -1), 1 / d),
    );
    const ds: V[] = [vec(slopes[0]!)];
    for (let i: number = 1; i < slopes.length; i++)
      ds.push(
        [0, 1, 2].map((k: number): number =>
          slopes[i - 1]![k]! * slopes[i]![k]! > 0
            ? Math.sign(slopes[i - 1]![k]!) *
              Math.min(Math.abs(slopes[i - 1]![k]!), Math.abs(slopes[i]![k]!))
            : 0,
        ) as V,
      );
    ds.push(vec(slopes.at(-1)!));
    ds.forEach((d: V): void => {
      d[1] = 1;
    });
    if (start) ds[0] = vec(start);
    if (end) ds[ds.length - 1] = vec(end);
    return {
      name,
      closed: false,
      spans: dy.map(
        (d: number, i: number): S => [
          vec(p[i]!),
          add(p[i]!, ds[i]!, d / 3),
          add(p[i + 1]!, ds[i + 1]!, -d / 3),
          vec(p[i + 1]!),
        ],
      ),
      lengthsMm: dy.map(Math.abs),
    };
  }

  /** Prepend a crown cap to a descending station course. Its angular displacement has zero crown Y derivative; the chosen 2*h parameter duration matches the first lower station's longitudinal derivative. The remaining knots must retain station ordering. This is an authored smooth-cap convention.
   *
   * @param name Native longitudinal course identifier.
   * @param p Crown followed by at least two lower physical-Y stations, mm.
   * @param end Optional terminal d(position)/d(nativeY) slope.
   * @returns Crown-cap and station spans with longitudinal-mm durations.
   * @throws Error if the first lower ring is not below the crown.
   */
  export function longitudinal(
    name: string,
    p: readonly C.Vector[],
    end?: C.Vector,
  ): Curve {
    const h: number = p[0]![1] - p[1]![1];
    if (h <= 0) throw new Error("Crown cap needs a lower ring");
    const radial: V = add(p[1]!, p[0]!, -1);
    radial[1] = 0;
    const ds: V = mul(radial, -1 / (2 * h));
    ds[1] = 1;
    const tail: Curve = station(name, p.slice(1), ds, end);
    tail.spans.unshift([
      vec(p[0]!),
      add(p[0]!, radial, 1 / 3),
      add(add(p[0]!, radial, 2 / 3), [0, -h / 3, 0]),
      vec(p[1]!),
    ]);
    tail.lengthsMm!.unshift(2 * h);
    return tail;
  }

  /** Intersect a physical-Y cubic course with a native height. Endpoint screening assumes each span stays within its endpoint Y range, as the station constructors do. Derivative roots split candidate spans into monotone intervals; up to 64 bisections locate the first root. Endpoint comparisons use 1e-9 mm, range screening 1e-8 mm; these are numerical chart guards, not anatomical tolerances.
   *
   * @param c Native Bernstein course with the stated Y-range premise.
   * @param y Native query height, mm.
   * @returns First found native intersection, or undefined when no span qualifies.
   */
  export function atY(c: Curve, y: number): V | undefined {
    for (const p of c.spans) {
      if (Math.abs(y - p[0][1]) < 1e-9) return vec(p[0]);
      if (Math.abs(y - p[3][1]) < 1e-9) return vec(p[3]);
      if (
        y < Math.min(p[0][1], p[3][1]) - 1e-8 ||
        y > Math.max(p[0][1], p[3][1]) + 1e-8
      )
        continue;
      const a: number = -p[0][1] + 3 * p[1][1] - 3 * p[2][1] + p[3][1];
      const b: number = 3 * p[0][1] - 6 * p[1][1] + 3 * p[2][1];
      const d: number = -3 * p[0][1] + 3 * p[1][1];
      const f: (t: number) => number = (t: number): number =>
        ((a * t + b) * t + d) * t + p[0][1] - y;
      const cuts: number[] = [0, 1];
      const disc: number = 4 * b * b - 12 * a * d;
      if (a !== 0 && disc >= 0)
        for (const t of [
          (-2 * b - Math.sqrt(disc)) / (6 * a),
          (-2 * b + Math.sqrt(disc)) / (6 * a),
        ])
          if (t > 0 && t < 1) cuts.push(t);
      if (a === 0 && b !== 0 && -d / (2 * b) > 0 && -d / (2 * b) < 1)
        cuts.push(-d / (2 * b));
      cuts.sort((x: number, z: number): number => x - z);
      for (let i: number = 1; i < cuts.length; i++) {
        let lo: number = cuts[i - 1]!;
        let hi: number = cuts[i]!;
        const flo: number = f(lo);
        if (f(lo) === 0) return bezier(p, lo);
        if (f(hi) === 0) return bezier(p, hi);
        if (flo * f(hi) > 0) continue;
        for (let k: number = 0; k < 64; k++) {
          const m: number = (lo + hi) / 2;
          if (m === lo || m === hi) break;
          if (flo * f(m) > 0) lo = m;
          else hi = m;
        }
        return bezier(p, (lo + hi) / 2);
      }
    }
    return undefined;
  }

  /** Return the largest native Z among course intersections at Y, in mm, or undefined if none qualifies. This is a geometric profile envelope; it does not establish image visibility or internal-surface exclusion. */
  export function frontZ(
    curves: readonly Curve[],
    y: number,
  ): number | undefined {
    const zs: number[] = curves
      .map((c: Curve): V | undefined => atY(c, y))
      .filter((q: V | undefined): q is V => q !== undefined)
      .map((q: V): number => q[2]);
    return zs.length ? Math.max(...zs) : undefined;
  }
}
