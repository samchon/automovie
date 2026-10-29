import { AutoMovieHumanRelief } from "../network/AutoMovieHumanRelief";
import { AutoMovieHumanHarmonicCurve } from "./AutoMovieHumanHarmonicCurve";
import { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";
import { AutoMovieHumanStationHermite } from "./AutoMovieHumanStationHermite";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * Evaluation of one tube of the body surface: a family of harmonic sections
 * indexed by a station s along the chain.
 *
 * Each principal layer's section lies in its frame (see
 * {@link AutoMovieHumanLoftFrame}). Without a frame the section is horizontal
 * at world height s, which is how every chain recovered from the saved
 * height-sliced loft is stored; in this note "height" therefore means the
 * station of such a chain.
 *
 * ## Representation
 *
 * A chain stores only its **principal layers** ({@link IAutoMovieHumanLoftChain}).
 * Each layer holds, at height `y` (mm), the harmonic section coefficients `c`
 * (see {@link AutoMovieHumanHarmonicCurve}) and their height derivative
 * `m = dc/dy` (mm per mm). Principal layers sit where the observed shape
 * changes character: silhouette extrema, volume extrema, feature onsets and
 * topology events. The observation fitter chooses them by recursive
 * bisection: it starts from the chain ends, interpolates the interval and
 * inserts a principal layer only where the interpolated section misses the
 * recovered section by more than its physical tolerance.
 *
 * ## Intermediate sections
 *
 * Between adjacent principal layers `i` and `i+1` every coefficient follows
 * the cubic Hermite polynomial of its two end values and two end slopes:
 *
 * ```text
 * u    = (y - y_i) / H,   H = y_{i+1} - y_i
 * c(y) = h00(u) c_i + h10(u) H m_i + h01(u) c_{i+1} + h11(u) H m_{i+1}
 * ```
 *
 * The slope is multiplied by the interval width H because the Hermite basis
 * is written in the unit parameter u, and `dc/du = H dc/dy` by the chain
 * rule. Each layer has one slope shared by both of its intervals, so the
 * family is C1 in y across principal layers and analytic in phase.
 *
 * The constant terms `(x0(y), z0(y))` are the section centroids, so the
 * chain's central axis is the Hermite curve `(x0(y), y, z0(y))` of the same
 * function rather than a separate polyline.
 */
export namespace AutoMovieHumanLoftChain {
  /**
   * Section coefficients at height y by the Hermite rule above.
   *
   * Heights outside the chain are refused rather than extrapolated, because
   * a chain's polynomial carries no shape evidence beyond its end layers.
   */
  export function coefficients(
    chain: IAutoMovieHumanLoftChain,
    y: number,
  ): number[] {
    return hermite(chain, y, false);
  }

  /**
   * Station derivative of the section coefficients at s, mm per mm.
   *
   * The derivative of the same Hermite rule; a region calibration that trims
   * a chain uses it to give the new end layer the slope of the original
   * function, so trimming changes no shape.
   */
  export function derivative(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): number[] {
    return hermite(chain, s, true);
  }

  /**
   * Indices `[lo, hi]` of the principal interval containing station s.
   *
   * Stations outside the chain are refused. The last interval also owns the
   * top layer itself.
   */
  export function bracket(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): [number, number] {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const bottom: number = layers[0]!.y;
    const top: number = layers[layers.length - 1]!.y;
    if (s < bottom - 1e-9 || s > top + 1e-9)
      throw new Error(`Station ${s} is outside chain ${chain.name}`);

    // Binary search over the sorted layer stations.
    let lo: number = 0;
    let hi: number = layers.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (layers[mid]!.y <= s) lo = mid;
      else hi = mid;
    }
    return [lo, hi];
  }

  /**
   * Out-of-plane lift of every control point at station s, by the same
   * Hermite rule as the coefficients; null for a chain whose layers carry
   * none, which then lies in its section planes.
   */
  export function lift(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): number[] | null {
    if (
      !chain.layers.some(
        (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.lift !== undefined,
      )
    )
      return null;
    return hermite(chain, s, false, liftArrays);
  }

  /** Exact derivative of the existing scalar lift Hermite interpolant. */
  export function liftDerivative(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): number[] | null {
    return lift(chain, s) === null ? null : hermite(chain, s, true, liftArrays);
  }

  /** Accessor of one Hermite-interpolated array of a layer: values and station slopes. */
  type Pick = (
    layer: IAutoMovieHumanLoftChain.ILayer,
  ) => [readonly number[], readonly number[]];

  /** Values and slopes of a layer's section coefficients. */
  function sectionArrays(
    layer: IAutoMovieHumanLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    return [layer.coefficients, layer.slopes];
  }

  /** Values and slopes of a layer's lift, zero where the layer has none. */
  function liftArrays(
    layer: IAutoMovieHumanLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    if (layer.lift !== undefined) return [layer.lift, layer.liftSlopes!];
    const zero: number[] = new Array<number>(
      layer.coefficients.length / 2,
    ).fill(0);
    return [zero, zero];
  }

  /** Hermite coefficients (or their station derivative) at s. */
  function hermite(
    chain: IAutoMovieHumanLoftChain,
    y: number,
    differentiate: boolean,
    pick: Pick = sectionArrays,
  ): number[] {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const [lo, hi] = bracket(chain, y);

    const [av, am] = pick(layers[lo]!);
    const [bv, bm] = pick(layers[hi]!);
    const a: IAutoMovieHumanLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (y - a.y) / H));

    // Layers that carry second derivatives (a feature chain expanded with
    // its jets) take the quintic rule; the cubic below stays as it was.
    if (
      pick === sectionArrays &&
      a.curvatures !== undefined &&
      b.curvatures !== undefined
    )
      return AutoMovieHumanStationHermite.combine(
        { value: av, slope: am, curvature: a.curvatures },
        { value: bv, slope: bm, curvature: b.curvatures },
        AutoMovieHumanStationHermite.weights(u, H, differentiate ? 1 : 0, true),
      );

    // Cubic Hermite basis on the unit interval, or its derivative divided by
    // H, which converts d/du back to d/ds.
    const h00: number = differentiate
      ? (6 * u ** 2 - 6 * u) / H
      : 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = differentiate
      ? (3 * u ** 2 - 4 * u + 1) / H
      : u ** 3 - 2 * u ** 2 + u;
    const h01: number = differentiate
      ? (-6 * u ** 2 + 6 * u) / H
      : -2 * u ** 3 + 3 * u ** 2;
    const h11: number = differentiate
      ? (3 * u ** 2 - 2 * u) / H
      : u ** 3 - u ** 2;

    // Slopes are per mm of height; H converts them to the unit parameter.
    return av.map(
      (c: number, k: number): number =>
        h00 * c + h10 * H * am[k]! + h01 * bv[k]! + h11 * H * bm[k]!,
    );
  }

  /**
   * Section plane at station s.
   *
   * An interval whose two layers and their outer neighbours are unframed is
   * horizontal and gives the horizontal frame at s exactly. Otherwise the
   * frame interpolates the two layers' frames, an unframed layer counting as
   * horizontal at its station. Origin tangents are Catmull-Rom differences
   * of the neighbouring origins, and angular velocities the three-point
   * differences of the neighbouring rotations (one-sided, exact for a
   * quadratic turn, at the chain's ends); both are scaled from per-station
   * to per-unit-parameter by the interval width. A layer's tangent and
   * angular velocity are the same for both of its intervals, so the plane
   * moves and turns C1 along the chain.
   */
  export function frame(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): AutoMovieHumanLoftFrame.IFrame {
    return plane(chain, s, false);
  }

  /** Derivative of that same frame per mm of declared station. */
  export function frameDerivative(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): AutoMovieHumanLoftFrame.IFrame {
    return plane(chain, s, true);
  }

  /** The existing plane rule and its matching analytic derivative. */
  function plane(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    derivative: boolean,
  ): AutoMovieHumanLoftFrame.IFrame {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const [lo, hi] = bracket(chain, s);
    const a: IAutoMovieHumanLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = layers[hi]!;

    // Planes carrying their station derivatives move component by component
    // by the Hermite rule, C2 with the coefficients (the plan's section 2).
    if (
      AutoMovieHumanStationHermite.framed(a) &&
      AutoMovieHumanStationHermite.framed(b)
    ) {
      const ea: AutoMovieHumanStationHermite.IEnd =
        AutoMovieHumanStationHermite.frameEnd(a);
      const eb: AutoMovieHumanStationHermite.IEnd =
        AutoMovieHumanStationHermite.frameEnd(b);
      const quintic: boolean =
        ea.curvature !== undefined && eb.curvature !== undefined;
      const w: number[] = AutoMovieHumanStationHermite.weights(
        Math.min(1, Math.max(0, (s - a.y) / (b.y - a.y))),
        b.y - a.y,
        derivative ? 1 : 0,
        quintic,
      );
      return AutoMovieHumanStationHermite.unflat(
        AutoMovieHumanStationHermite.combine(ea, eb, w),
      );
    }
    if (
      a.frame === undefined &&
      b.frame === undefined &&
      layers[lo - 1]?.frame === undefined &&
      layers[hi + 1]?.frame === undefined
    )
      return derivative
        ? { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] }
        : AutoMovieHumanLoftFrame.horizontal(s);

    const frameOf = (k: number): AutoMovieHumanLoftFrame.IFrame =>
      layers[k]!.frame ?? AutoMovieHumanLoftFrame.horizontal(layers[k]!.y);
    const H: number = b.y - a.y;

    // Catmull-Rom tangent at layer k, per unit parameter of this interval.
    const tangent = (k: number): [number, number, number] => {
      const p: number = Math.max(0, k - 1);
      const n: number = Math.min(layers.length - 1, k + 1);
      const op: [number, number, number] = frameOf(p).origin;
      const on: [number, number, number] = frameOf(n).origin;
      const span: number = layers[n]!.y - layers[p]!.y;
      return [0, 1, 2].map(
        (i: number): number => ((on[i]! - op[i]!) / span) * H,
      ) as [number, number, number];
    };

    // Angular velocity at layer k, per unit parameter of this interval:
    // the three-point derivative of the rotation from the constant turns of
    // its two intervals, (h1 r0 + h0 r1) / (h0 + h1) inside the chain and
    // r0 + (r0 - r1) h0 / (h0 + h1) at an end (r0 the end interval's turn,
    // r1 the next one's).
    const turn = (i: number): [number, number, number] =>
      AutoMovieHumanLoftFrame.rate(
        frameOf(i),
        frameOf(i + 1),
        layers[i + 1]!.y - layers[i]!.y,
      );
    const span = (i: number): number => layers[i + 1]!.y - layers[i]!.y;
    const velocity = (k: number): [number, number, number] => {
      const last: number = layers.length - 1;
      let w: [number, number, number];
      if (last === 1) w = turn(0);
      else if (k === 0 || k === last) {
        const [i0, i1] = k === 0 ? [0, 1] : [last - 1, last - 2];
        const r0: [number, number, number] = turn(i0);
        const r1: [number, number, number] = turn(i1);
        const f: number = span(i0) / (span(i0) + span(i1));
        w = [0, 1, 2].map(
          (i: number): number => r0[i]! + (r0[i]! - r1[i]!) * f,
        ) as [number, number, number];
      } else {
        const r0: [number, number, number] = turn(k - 1);
        const r1: [number, number, number] = turn(k);
        const h0: number = span(k - 1);
        const h1: number = span(k);
        w = [0, 1, 2].map(
          (i: number): number => (h1 * r0[i]! + h0 * r1[i]!) / (h0 + h1),
        ) as [number, number, number];
      }
      return [w[0] * H, w[1] * H, w[2] * H];
    };

    const interpolate: typeof AutoMovieHumanLoftFrame.interpolate = derivative
      ? AutoMovieHumanLoftFrame.derivative
      : AutoMovieHumanLoftFrame.interpolate;
    const result: AutoMovieHumanLoftFrame.IFrame = interpolate(
      frameOf(lo),
      frameOf(hi),
      tangent(lo),
      tangent(hi),
      Math.min(1, Math.max(0, (s - a.y) / H)),
      velocity(lo),
      velocity(hi),
    );
    if (!derivative) return result;
    const physical: (v: [number, number, number]) => [number, number, number] =
      (v: [number, number, number]): [number, number, number] =>
        [v[0] / H, v[1] / H, v[2] / H];
    return {
      origin: physical(result.origin), u: physical(result.u), v: physical(result.v),
    };
  }

  /** Central-axis point `[x, y, z]` in mm at station s: the section centroid. */
  export function axis(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): [number, number, number] {
    const [x, z] = center(chain, coefficients(chain, s));
    const f: AutoMovieHumanLoftFrame.IFrame = frame(chain, s);
    const p: [number, number, number] = AutoMovieHumanLoftFrame.place(f, x, z);

    // The mean lift over uniform phase is the control-value mean, as for
    // the in-plane centroid.
    const l: number[] | null = lift(chain, s);
    if (l === null) return p;
    const h: number =
      l.reduce((sum: number, v: number): number => sum + v, 0) / l.length;
    const n: [number, number, number] = normal(f);
    return [p[0] + h * n[0], p[1] + h * n[1], p[2] + h * n[2]];
  }

  /**
   * Evaluate a section of the chain's basis and its phase derivative.
   *
   * @param chain Chain whose basis and order the coefficients follow.
   * @param coefficients Section coefficients, as from {@link coefficients}.
   * @param t Phase in radians.
   * @returns `[x, z, dx/dt, dz/dt]` in the section plane, mm.
   */
  export function section(
    chain: IAutoMovieHumanLoftChain,
    coefficients: readonly number[],
    t: number,
  ): [number, number, number, number] {
    return chain.basis === "spline"
      ? AutoMovieHumanSplineCurve.evaluate(coefficients, chain.order, t)
      : AutoMovieHumanHarmonicCurve.evaluate(coefficients, chain.order, t);
  }

  /**
   * Mean `[x, z]` of a section over phase, a point of the central axis.
   *
   * The constant terms of a harmonic section; the control-point mean of a
   * spline section.
   */
  export function center(
    chain: IAutoMovieHumanLoftChain,
    coefficients: readonly number[],
  ): [number, number] {
    if (chain.basis !== "spline")
      return [
        coefficients[0]!,
        coefficients[AutoMovieHumanHarmonicCurve.width(chain.order)]!,
      ];
    const n: number = chain.order;
    let x: number = 0;
    let z: number = 0;
    for (let i: number = 0; i < n; i++) {
      x += coefficients[i]!;
      z += coefficients[n + i]!;
    }
    return [x / n, z / n];
  }

  /**
   * Planar section coordinates of world points in the frame at station s.
   *
   * Used to give inherited ring vertices phases by the chain's own rule.
   */
  export function local(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    points: readonly (readonly [number, number, number])[],
  ): [number, number][] {
    const f: AutoMovieHumanLoftFrame.IFrame = frame(chain, s);
    return points.map(
      (p: readonly [number, number, number]): [number, number] =>
        AutoMovieHumanLoftFrame.local(f, p),
    );
  }

  /**
   * Ring of world points `[x, y, z]` at station s and the given phases.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain; world height for horizontal layers.
   * @param phases Correspondence phases in radians.
   */
  export function ring(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    phases: readonly number[],
  ): [number, number, number][] {
    const c: number[] = coefficients(chain, s);
    const f: AutoMovieHumanLoftFrame.IFrame = frame(chain, s);

    // A lifted section leaves its plane along the frame normal by the
    // spline of its lift values, evaluated as the x block of a section
    // whose z block repeats it.
    const l: number[] | null = lift(chain, s);
    const lifted: number[] | null = l === null ? null : [...l, ...l];
    const n: [number, number, number] = normal(f);

    return phases.map((t: number): [number, number, number] => {
      const p: [number, number, number, number] = section(chain, c, t);
      const q: [number, number, number] = AutoMovieHumanLoftFrame.place(
        f,
        p[0],
        p[1],
      );
      if (lifted !== null) {
        const h: number = AutoMovieHumanSplineCurve.evaluate(
          lifted,
          chain.order,
          t,
        )[0];
        for (let k: number = 0; k < 3; k++) q[k]! += h * n[k]!;
      }
      // Reliefs move the base point along their axes.
      for (const relief of chain.reliefs ?? []) {
        const d: number = AutoMovieHumanRelief.height(relief, s, t)[0];
        if (d === 0) continue;
        for (let k: number = 0; k < 3; k++) q[k]! += d * relief.axis[k]!;
      }
      return q;
    });
  }

  /** Unit normal `v x u` of a section frame: up for a horizontal frame. */
  function normal(f: AutoMovieHumanLoftFrame.IFrame): [number, number, number] {
    return [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
  }
}
