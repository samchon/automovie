import { AutoMovieNaturalSpline } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieHumanNativeScaleProfile,
} from "@automovie/interface";

/**
 * A directional tissue scale along a family's course, as a function of material station with its own 2-jet.
 *
 * A native source applies its scale to the source function, a(s)·f(s) with the product-rule jets, so it needs the scale's value and its
 * first and second station derivatives at every station it reads, not only the scale's values at the family's knots. Sampling a station-
 * varying scale at the knots alone leaves the wall between two knots up to 1.3 mm off the law (f1's trunk under the allsite95 calipers,
 * between the 446 and 496 mm knots), and a site junction that writes the exact value then makes a ridge one station gap long.
 *
 * The law between two sites is the endpoint-flat quintic 10t^3 - 15t^4 + 6t^5 already used by the native calibration: its first and
 * second derivatives vanish at both sites, so the scale is C2 everywhere and is held at the first and last site's value outside them. Its
 * value reproduces the calibration's arithmetic term for term, so a caller that passes it where a plain profile stood reads the same numbers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the station-function premise, the quintic law, its C2 joins, the held ends and the defect a knot-sampled scale makes.
 * @evidence contracts/development/design.md#principled-representation One callable carries value, analytic 2-jet, the stations where its third derivative may jump and its constant value when it has one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Profile, constant and handoff cover the wall, hand, arm and leg scales; `of` recovers the carried jet from a plain scale parameter; `ICentre` and `centre` carry the line a consumer chooses for the scale to hold still.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No finite difference and no sampled table: every derivative is the closed form of the quintic and of the product rule.
 */
export namespace AutoMovieHumanNativeScaleProfile {
  /** The value and two material derivatives of a directional profile or centre. */
  export type IJet = IAutoMovieHumanNativeScaleProfile.IJet;

  /** A directional material scale with its carried 2-jet. */
  export type IScale = IAutoMovieHumanNativeScaleProfile.IScale;

  /**
   * The endpoint-flat quintic between anchored sites, held at the first and last site's value outside them.
   *
   * @param anchors Material stations in mm, strictly increasing, each with its positive depth and breadth ratio.
   *
   * @evidence contracts/development/implementation.md#principled-implementation h(t) = t^3(10 - 15t + 6t^2), h' = 30t^2(1 - t)^2 / L and h'' = 60t(1 - t)(1 - 2t) / L^2 with t the share of the span L; both derivatives vanish at each site.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span search serves value and jet; the value expression is the calibration profile's, term for term.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses empty, unordered or nonfinite anchors and nonpositive ratios instead of sorting or clamping them.
   * @evidence contracts/development/common.md#meaningful-documentation States the law, its units and its held ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n) admission once; each read is a linear scan of the few anchors with constant arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The anchors are copied once and shared by value and jet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only its copied anchors for the caller's lifetime.
   */
  export function create(anchors: readonly (readonly [number, AutoMovieVector2Tuple])[]): IScale {
    const sites: [number, AutoMovieVector2Tuple][] = anchors.map(
      ([station, value]: readonly [number, AutoMovieVector2Tuple]): [number, AutoMovieVector2Tuple] => [
        station,
        [value[0], value[1]],
      ],
    );
    if (
      sites.length === 0 ||
      !sites.every(
        ([station, value]: [number, AutoMovieVector2Tuple], k: number): boolean =>
          Number.isFinite(station) &&
          value.every((x: number): boolean => Number.isFinite(x) && x > 0) &&
          (k === 0 || station > sites[k - 1]![0]),
      )
    )
      throw new Error(
        "scale profile needs finite increasing sites with positive finite ratios",
      );

    // The span holding a station: -1 at or before the first site, n past the last, otherwise the index of its right site. A station on
    // a site reads the span ending there, as the calibration profile does.
    const span = (station: number): number => {
      if (station <= sites[0]![0]) return -1;
      for (let k: number = 1; k < sites.length; k++)
        if (station <= sites[k]![0]) return k;
      return sites.length;
    };
    const held = (value: AutoMovieVector2Tuple): IJet => ({
      value: [value[0], value[1]],
      first: [0, 0],
      second: [0, 0],
    });
    const read = (station: number): AutoMovieVector2Tuple => {
      const k: number = span(station);
      if (k < 0) return [sites[0]![1][0], sites[0]![1][1]];
      if (k >= sites.length) return [sites.at(-1)![1][0], sites.at(-1)![1][1]];
      const [a, b]: [[number, AutoMovieVector2Tuple], [number, AutoMovieVector2Tuple]] = [sites[k - 1]!, sites[k]!];
      const h: number = smooth((station - a[0]) / (b[0] - a[0]));
      return [a[1][0] + h * (b[1][0] - a[1][0]), a[1][1] + h * (b[1][1] - a[1][1])];
    };
    const jet = (station: number): IJet => {
      const k: number = span(station);
      if (k < 0) return held(sites[0]![1]);
      if (k >= sites.length) return held(sites.at(-1)![1]);
      const [a, b]: [[number, AutoMovieVector2Tuple], [number, AutoMovieVector2Tuple]] = [sites[k - 1]!, sites[k]!];
      const length: number = b[0] - a[0];
      const [h, h1, h2]: [number, number, number] = weight(
        (station - a[0]) / length,
        length,
      );
      const rise: AutoMovieVector2Tuple = [b[1][0] - a[1][0], b[1][1] - a[1][1]];
      return {
        value: [a[1][0] + h * rise[0], a[1][1] + h * rise[1]],
        first: [h1 * rise[0], h1 * rise[1]],
        second: [h2 * rise[0], h2 * rise[1]],
      };
    };
    const first: AutoMovieVector2Tuple = sites[0]![1];
    const constant: AutoMovieVector2Tuple | null = sites.every(
      ([, value]: [number, AutoMovieVector2Tuple]): boolean =>
        value[0] === first[0] && value[1] === first[1],
    )
      ? [first[0], first[1]]
      : null;
    return Object.assign(read, {
      jet,
      breaks: sites.map(([station]: [number, AutoMovieVector2Tuple]): number => station),
      constant,
    });
  }

  /**
   * One ratio at every station.
   *
   * @param value Positive finite depth and breadth ratios.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A constant has zero derivatives everywhere and no break.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the same callable shape as a profile, so a handoff composes either.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a nonpositive or nonfinite ratio.
   * @evidence contracts/development/common.md#meaningful-documentation States the zero jet and the empty break list.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A constant shares no preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one copied pair.
   */
  export function constant(value: AutoMovieVector2Tuple): IScale {
    if (!value.every((x: number): boolean => Number.isFinite(x) && x > 0))
      throw new Error("constant scale needs positive finite ratios");
    const fixed: AutoMovieVector2Tuple = [value[0], value[1]];
    const breaks: number[] = [];
    return Object.assign((): AutoMovieVector2Tuple => [fixed[0], fixed[1]], {
      jet: (): IJet => ({
        value: [fixed[0], fixed[1]],
        first: [0, 0],
        second: [0, 0],
      }),
      breaks,
      constant: fixed,
    });
  }

  /**
   * Hand one scale over to another between two stations with the endpoint-flat quintic weight, as a root hands its constant root ratio
   * over to its limb's own profile between its rail and its release.
   *
   * @param before The scale held up to `start`.
   * @param after The scale reached at `end` and held past it.
   * @param start Material station, mm, where the handoff begins.
   * @param end Material station, mm, past `start`, where it ends.
   *
   * @evidence contracts/development/implementation.md#principled-implementation s = B + w(A - B) with w the quintic weight; the jet is the product rule B' + w'(A - B) + w(A' - B') and B'' + w''(A - B) + 2w'(A' - B') + w(A'' - B''). The weight's flat ends keep the result C2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The value expression is the native root handoff's, term for term, so the composed scale reads the same numbers as the closure it replaces.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a nonfinite or empty handoff interval.
   * @evidence contracts/development/common.md#meaningful-documentation States the weight, the product rule and the union of breaks.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two scale reads and constant arithmetic per station.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows both scales without copying them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains both borrowed scales and one sorted break list.
   */
  export function handoff(
    before: IScale,
    after: IScale,
    start: number,
    end: number,
  ): IScale {
    if (!(Number.isFinite(start) && Number.isFinite(end) && end > start))
      throw new Error("scale handoff needs a finite increasing interval");
    const length: number = end - start;
    const read = (station: number): AutoMovieVector2Tuple => {
      const b: AutoMovieVector2Tuple = before(station);
      const a: AutoMovieVector2Tuple = after(station);
      const h: number = smooth((station - start) / length);
      return [b[0] + h * (a[0] - b[0]), b[1] + h * (a[1] - b[1])];
    };
    const jet = (station: number): IJet => {
      const b: IJet = before.jet(station);
      const a: IJet = after.jet(station);
      const [w, w1, w2]: [number, number, number] = weight(
        (station - start) / length,
        length,
      );
      const order = (k: 0 | 1): [number, number, number] => {
        const d: number = a.value[k] - b.value[k];
        const d1: number = a.first[k] - b.first[k];
        const d2: number = a.second[k] - b.second[k];
        return [
          b.value[k] + w * d,
          b.first[k] + w1 * d + w * d1,
          b.second[k] + w2 * d + 2 * w1 * d1 + w * d2,
        ];
      };
      const [u, v]: [number, number, number][] = [order(0), order(1)];
      return {
        value: [u![0], v![0]],
        first: [u![1], v![1]],
        second: [u![2], v![2]],
      };
    };
    const held: AutoMovieVector2Tuple | null = before.constant;
    const reached: AutoMovieVector2Tuple | null = after.constant;
    const constant: AutoMovieVector2Tuple | null =
      held !== null &&
      reached !== null &&
      held[0] === reached[0] &&
      held[1] === reached[1]
        ? [held[0], held[1]]
        : null;
    return Object.assign(read, {
      jet,
      breaks: [...new Set([...before.breaks, ...after.breaks, start, end])].sort(
        (x: number, y: number): number => x - y,
      ),
      constant,
    });
  }

  /** The section-coordinate line the scale holds fixed. */
  export type ICentre = IAutoMovieHumanNativeScaleProfile.ICentre;

  /**
   * The natural cubic through a centre line's knot samples, continued past its first and last knot along its end tangent.
   *
   * @param knots Material stations in mm, strictly increasing, at least two.
   * @param u The centre's chart u at each knot, mm.
   * @param v The centre's chart v at each knot, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The natural cubic spline is twice continuously differentiable with zero second derivative at both ends, so its tangent continuation keeps the line C2 over a cap; value and both derivatives are the spline's own polynomial reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two engine splines and one read per direction; the knots are the breaks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses unordered, nonfinite or mismatched samples; no finite difference and no clamped end.
   * @evidence contracts/development/common.md#meaningful-documentation States the interpolant, its continuity and its continuation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(n) tridiagonal preparation per direction and an O(log n) read per station.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both splines are prepared once and shared by every read; the engine's natural spline is reused, not rewritten.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains two knot-sized splines for the caller's lifetime.
   */
  export function centre(
    knots: readonly number[],
    u: readonly number[],
    v: readonly number[],
  ): ICentre {
    if (
      knots.length < 2 ||
      u.length !== knots.length ||
      v.length !== knots.length ||
      ![...knots, ...u, ...v].every(Number.isFinite) ||
      !knots.every((s: number, k: number): boolean => k === 0 || s > knots[k - 1]!)
    )
      throw new Error(
        "scaling centre line needs at least two finite increasing knots with one finite u and v each",
      );
    const splines: IAutoMovieNaturalCubicSpline[] = [u, v].map(
      (values: readonly number[]): IAutoMovieNaturalCubicSpline =>
        AutoMovieNaturalSpline.create(knots, values),
    );
    const [first, last]: [number, number] = [knots[0]!, knots.at(-1)!];
    const read = (k: 0 | 1, station: number): [number, number, number] => {
      const end: number | null =
        station < first ? first : station > last ? last : null;
      if (end === null) return AutoMovieNaturalSpline.read(splines[k]!, station);
      const [value, slope]: [number, number, number] =
        AutoMovieNaturalSpline.read(splines[k]!, end);
      return [value + slope * (station - end), slope, 0];
    };
    return {
      jet: (station: number): IJet => {
        const a: [number, number, number] = read(0, station);
        const b: [number, number, number] = read(1, station);
        return {
          value: [a[0], b[0]],
          first: [a[1], b[1]],
          second: [a[2], b[2]],
        };
      },
      breaks: [...knots],
    };
  }

  /**
   * The carried jet of a scale parameter, or null for a plain function that carries none.
   *
   * @param scale Any `(station) => [a, b]` scale.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A scale built here carries `jet`, `breaks` and `constant`; any other function has no analytic derivative to read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One guard lets a consumer keep its plain `scale` parameter type.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never differentiates a plain function numerically; it reports the jet absent.
   * @evidence contracts/development/common.md#meaningful-documentation States the null meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant member checks.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure guard schedules no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(scale: (station: number) => AutoMovieVector2Tuple): IScale | null {
    const carried: Partial<IScale> = scale as Partial<IScale>;
    return typeof carried.jet === "function" &&
      Array.isArray(carried.breaks) &&
      carried.constant !== undefined
      ? (scale as IScale)
      : null;
  }
}

/** The calibration's endpoint-flat quintic share, held at 0 and 1 outside its interval; the same expression term for term. */
function smooth(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));
}

/** The quintic share and its first and second station derivatives over a span of `length` mm; both derivatives vanish outside (0, 1). */
function weight(t: number, length: number): [number, number, number] {
  if (t <= 0) return [0, 0, 0];
  if (t >= 1) return [1, 0, 0];
  return [
    smooth(t),
    (30 * t * t * (1 - t) ** 2) / length,
    (60 * t * (1 - t) * (1 - 2 * t)) / length ** 2,
  ];
}
