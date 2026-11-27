import type {
  IAutoMovieLoftCapSource,
  IAutoMovieLoftChain,
  IAutoMovieLoftCoefficientSource,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

import { AutoMovieEngineHarmonicCurve } from "./AutoMovieEngineHarmonicCurve";
import { AutoMovieEngineLoftCapSource } from "./AutoMovieEngineLoftCapSource";
import { AutoMovieEngineLoftCoefficientSource } from "./AutoMovieEngineLoftCoefficientSource";
import { AutoMovieEngineLoftFrame } from "./AutoMovieEngineLoftFrame";
import { AutoMovieEngineLoftFrameSource } from "./AutoMovieEngineLoftFrameSource";
import { AutoMovieEngineLoftPoint } from "./AutoMovieEngineLoftPoint";
import { AutoMovieEngineSplineCurve } from "./AutoMovieEngineSplineCurve";
import { AutoMovieEngineStationHermite } from "./AutoMovieEngineStationHermite";

/**
 * Read a chain from its immutable principal values and explicit
 * interpolation/source data.
 *
 * Ordinary coefficients and lift retain cubic/quintic physical-station Hermite
 * interpolation. Capped coefficientSource rows instead interpolate in their
 * declared common root/angle coordinate and carry derivatives to station.
 * Matching frameSource rows read their actual analytic axis; ordinary/mixed
 * boundaries retain the existing layer-plane interpolation. Explicit native
 * sources own actual polar geometry; compatibility coefficients remain
 * independently readable. Polar phase meaning and principal-layer domain are
 * unchanged. Full cap-span ownership and apex G2 are not certified by this
 * regular chart.
 */
export namespace AutoMovieEngineLoftChain {
  /**
   * Section coefficients at height y by the Hermite rule above.
   *
   * Heights outside the chain are refused rather than extrapolated, because a
   * chain's polynomial carries no shape evidence beyond its end layers.
   */
  export function coefficients(
    chain: IAutoMovieLoftChain,
    y: number,
  ): number[] {
    return hermite(chain, y, false);
  }

  /**
   * Station derivative of the section coefficients at s, mm per mm.
   *
   * The derivative of the same Hermite rule; a region calibration that trims a
   * chain uses it to give the new end layer the slope of the original function,
   * so trimming changes no shape.
   */
  export function derivative(chain: IAutoMovieLoftChain, s: number): number[] {
    return hermite(chain, s, true);
  }

  /**
   * Indices `[lo, hi]` of the principal interval containing station s.
   *
   * Stations outside the chain are refused. The last interval also owns the top
   * layer itself.
   */
  export function bracket(
    chain: IAutoMovieLoftChain,
    s: number,
  ): [number, number] {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
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
   * Out-of-plane lift of every control point at station s, by the same Hermite
   * rule as the coefficients; null for a chain whose layers carry none, which
   * then lies in its section planes.
   */
  export function lift(chain: IAutoMovieLoftChain, s: number): number[] | null {
    if (
      !chain.layers.some(
        (l: IAutoMovieLoftChain.ILayer): boolean => l.lift !== undefined,
      )
    )
      return null;
    return hermite(chain, s, false, liftArrays);
  }

  /**
   * Frame of an unchanged actual-axis interval or its declared layer
   * interpolation. Different source owners at a continuation boundary use the
   * copied endpoint jets.
   */
  export function frame(
    chain: IAutoMovieLoftChain,
    s: number,
  ): IAutoMovieLoftSectionFrame {
    const cap: IAutoMovieLoftCapSource.ISource | null =
      AutoMovieEngineLoftCapSource.at(chain, s);
    if (cap !== null) return cap.axis.at(s);
    const [lo, hi]: [number, number] = bracket(chain, s);
    return AutoMovieEngineLoftFrameSource.frame(chain, s, lo, hi);
  }

  /** Central-axis point `[x, y, z]` in mm at station s: the section centroid. */
  export function axis(
    chain: IAutoMovieLoftChain,
    s: number,
  ): [number, number, number] {
    const [x, z]: [number, number] = center(chain, coefficients(chain, s));
    const f: IAutoMovieLoftSectionFrame = frame(chain, s);
    const p: [number, number, number] = AutoMovieEngineLoftFrame.place(f, x, z);

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
    chain: IAutoMovieLoftChain,
    coefficients: readonly number[],
    t: number,
  ): [number, number, number, number] {
    return chain.basis === "spline"
      ? AutoMovieEngineSplineCurve.evaluate(coefficients, chain.order, t)
      : AutoMovieEngineHarmonicCurve.evaluate(coefficients, chain.order, t);
  }

  /**
   * Mean `[x, z]` of a section over phase, a point of the central axis.
   *
   * The constant terms of a harmonic section; the control-point mean of a
   * spline section.
   */
  export function center(
    chain: IAutoMovieLoftChain,
    coefficients: readonly number[],
  ): [number, number] {
    if (chain.basis !== "spline")
      return [
        coefficients[0]!,
        coefficients[AutoMovieEngineHarmonicCurve.width(chain.order)]!,
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
    chain: IAutoMovieLoftChain,
    s: number,
    points: readonly (readonly [number, number, number])[],
  ): [number, number][] {
    const f: IAutoMovieLoftSectionFrame = frame(chain, s);
    return points.map(
      (p: readonly [number, number, number]): [number, number] =>
        AutoMovieEngineLoftFrame.local(f, p),
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
    chain: IAutoMovieLoftChain,
    s: number,
    phases: readonly number[],
  ): [number, number, number][] {
    const point: (t: number) => [number, number, number] = sampler(chain, s);
    return phases.map((t: number): [number, number, number] => point(t));
  }

  /**
   * Prepare the existing value-only station sampler, including actual source
   * metadata.
   *
   * @param chain Immutable chain whose retained sources remain unchanged.
   * @param s Owned station in the principal interval or an explicitly retained
   *   original cap, mm.
   */
  export function sampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => [number, number, number] {
    return AutoMovieEngineLoftPoint.sampler(chain, s);
  }

  /** Prepare actual value and phase tangent without station-jet admission. */
  export function phaseSampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): IAutoMovieLoftChain.IPhaseSamplerResult {
    return AutoMovieEngineLoftPoint.phaseSampler(chain, s);
  }

  /**
   * One world point at station s and phase t, prepared and read at once: a
   * reader of many phases at one station takes {@link sampler} instead.
   *
   * @param chain Chain to evaluate.
   * @param s Regular station, mm.
   * @param t Phase in radians.
   */
  export function point(
    chain: IAutoMovieLoftChain,
    s: number,
    t: number,
  ): [number, number, number] {
    return AutoMovieEngineLoftPoint.point(chain, s, t);
  }

  /*
   * Accessor of one Hermite-interpolated array of a layer: values and station
   * slopes.
   */
  type Pick = (
    layer: IAutoMovieLoftChain.ILayer,
  ) => [readonly number[], readonly number[]];

  /*
   * Values and slopes of a layer's section coefficients.
   */
  function sectionArrays(
    layer: IAutoMovieLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    return [layer.coefficients, layer.slopes];
  }

  /*
   * Values and slopes of a layer's lift, zero where the layer has none.
   */
  function liftArrays(
    layer: IAutoMovieLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    if (layer.lift !== undefined) return [layer.lift, layer.liftSlopes!];
    const zero: number[] = new Array<number>(
      layer.coefficients.length / 2,
    ).fill(0);
    return [zero, zero];
  }

  /*
   * Hermite coefficients (or their station derivative) at s.
   */
  function hermite(
    chain: IAutoMovieLoftChain,
    y: number,
    differentiate: boolean,
    pick: Pick = sectionArrays,
  ): number[] {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const [lo, hi]: [number, number] = bracket(chain, y);
    if (pick === sectionArrays) {
      const source: IAutoMovieLoftCoefficientSource.IControls | null =
        AutoMovieEngineLoftCoefficientSource.controls(chain, y);
      if (source !== null)
        return AutoMovieEngineStationHermite.combine(
          source.a,
          source.b,
          AutoMovieEngineLoftCoefficientSource.weights(source, differentiate ? 1 : 0),
        );
    }

    const [av, am]: [readonly number[], readonly number[]] = pick(layers[lo]!);
    const [bv, bm]: [readonly number[], readonly number[]] = pick(layers[hi]!);
    const a: IAutoMovieLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (y - a.y) / H));

    // Layers that carry second derivatives (a feature chain expanded with
    // its jets) take the quintic rule; the cubic below stays as it was.
    const ac: number[] | undefined =
      pick === sectionArrays ? a.curvatures : a.liftCurvatures;
    const bc: number[] | undefined =
      pick === sectionArrays ? b.curvatures : b.liftCurvatures;
    if (ac !== undefined && bc !== undefined)
      return AutoMovieEngineStationHermite.combine(
        { value: av, slope: am, curvature: ac },
        { value: bv, slope: bm, curvature: bc },
        AutoMovieEngineStationHermite.weights(u, H, differentiate ? 1 : 0, true),
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

  /*
   * Unit normal `v x u` of a section frame: up for a horizontal frame.
   */
  function normal(f: IAutoMovieLoftSectionFrame): [number, number, number] {
    return [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
  }
}
