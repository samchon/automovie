import type { IAutoMovieGhoshConicApproximationBalance } from "@automovie/interface";

import { GhoshConicApproximationDisplacement as displacement } from "./GhoshConicApproximationDisplacement";

/**
 * Balance a bitangent conic's signed normal extrema with numerical exchange.
 * Initial source nodes bracket witnessed displacement peaks. Golden-section
 * refinement locates each such peak between nodes, then its source coordinate
 * joins the coefficient bisection and the two signed lobes are rebalanced. This
 * implements the extrema/equioscillation criterion of Ghosh et al. (2007),
 * sections 3.2–3.3 and 6, without treating a fixed grid maximum as a supremum.
 *
 * The returned tuple is [rho, refined maximum displacement in millimetres].
 * Finite peak brackets still do not certify that an arbitrary callback has no
 * unwitnessed extrema; exhausted exchange or an invalid normal returns absent.
 * Source endpoints have displacement zero by exact endpoint interpolation.
 */
export function GhoshConicApproximationBalance(
  sample: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[0],
  domain: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[1],
  bounds: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[2],
  maximumExchanges: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[3],
  roundoffMm: Parameters<IAutoMovieGhoshConicApproximationBalance.Operation>[4],
): ReturnType<IAutoMovieGhoshConicApproximationBalance.Operation> {
  /** A cached source point/normal already expressed in the tangent triangle. */
  type Coordinate = { value: readonly number[]; normal: readonly number[] };

  /**
   * A fitting witness has a source parameter so its neighboring peaks can be
   * bracketed.
   */
  interface Witness {
    t: number;
    coordinate: Coordinate;
  }

  /** One observed normal displacement, signed in the source's orientation. */
  interface Observation {
    t: number;
    d: number;
  }
  const cache: Map<number, Coordinate> = new Map();
  const witnesses: Witness[] = [];
  const ratio: number = (Math.sqrt(5) - 1) / 2;
  const goldenIterations: number = Math.ceil(53 / Math.log2(1 / ratio));
  const parameterRoundoff: number =
    128 *
    Number.EPSILON *
    Math.max(Math.abs(domain[0]), Math.abs(domain[1]), domain[1] - domain[0]);

  /**
   * Reuse deterministic borrowed callbacks, retaining only call-local
   * snapshots.
   */
  function coordinate(t: number): Coordinate | undefined {
    const existing: Coordinate | undefined = cache.get(t);
    if (existing !== undefined) return existing;
    const value: Coordinate | undefined = sample(t);
    if (value !== undefined) cache.set(t, value);
    return value;
  }

  /** Every candidate uses the same normal graph and triangle-branch admission. */
  function observe(t: number, rho: number): number | undefined {
    const value: Coordinate | undefined = coordinate(t);
    return value === undefined ? undefined : displacement(value, rho);
  }

  /** A signed-lobe sum vanishes precisely at the witnessed equioscillation. */
  function imbalance(rho: number): readonly [number, number] | undefined {
    let positive: number = 0;
    let negative: number = 0;
    for (const witness of witnesses) {
      const d: number | undefined = displacement(witness.coordinate, rho);
      if (d === undefined) return undefined;
      positive = Math.max(positive, d);
      negative = Math.min(negative, d);
    }
    return [positive + negative, Math.max(positive, -negative)];
  }

  /** Refine an observed local absolute maximum without increasing a fixed grid. */
  function peak(
    a: Observation,
    center: Observation,
    b: Observation,
    rho: number,
  ): Observation | undefined {
    let left: number = a.t;
    let right: number = b.t;
    let x: number = right - ratio * (right - left);
    let y: number = left + ratio * (right - left);
    let dx: number | undefined = observe(x, rho);
    let dy: number | undefined = observe(y, rho);
    if (dx === undefined || dy === undefined) return undefined;
    let best: Observation = center;
    for (let iteration: number = 0; iteration < goldenIterations; ++iteration) {
      if (Math.abs(dx) > Math.abs(best.d)) best = { t: x, d: dx };
      if (Math.abs(dy) > Math.abs(best.d)) best = { t: y, d: dy };
      if (right - left <= parameterRoundoff) break;
      if (Math.abs(dx) < Math.abs(dy)) {
        left = x;
        x = y;
        dx = dy;
        y = left + ratio * (right - left);
        dy = observe(y, rho);
        if (dy === undefined) return undefined;
      } else {
        right = y;
        y = x;
        dy = dx;
        x = right - ratio * (right - left);
        dx = observe(x, rho);
        if (dx === undefined) return undefined;
      }
    }
    return best;
  }
  for (let i: number = 1; i < 32; ++i) {
    const t: number = domain[0] + ((domain[1] - domain[0]) * i) / 32;
    const value: Coordinate | undefined = coordinate(t);
    if (value === undefined) return undefined;
    witnesses.push({ t, coordinate: value });
  }
  for (let exchange: number = 0; exchange < maximumExchanges; ++exchange) {
    let left: number = bounds[0];
    let right: number = bounds[1];
    const el: readonly [number, number] | undefined = imbalance(left);
    const er: readonly [number, number] | undefined = imbalance(right);
    if (el === undefined || er === undefined) return undefined;
    const numericalConic: boolean = Math.max(el[1], er[1]) <= roundoffMm;
    if (!numericalConic && el[0] * er[0] > 0) return undefined;
    let rho: number = (left + right) / 2;
    for (
      let iteration: number = 0;
      !numericalConic && iteration < 32;
      ++iteration
    ) {
      rho = (left + right) / 2;
      const error: readonly [number, number] | undefined = imbalance(rho);
      if (error === undefined) return undefined;
      if (error[0] * el[0] > 0) left = rho;
      else right = rho;
    }
    const measured: readonly [number, number] | undefined = imbalance(rho);
    if (measured === undefined) return undefined;
    if (measured[1] <= roundoffMm) return [rho, measured[1]];
    witnesses.sort((a: Witness, b: Witness): number => a.t - b.t);
    const observations: Observation[] = [{ t: domain[0], d: 0 }];
    for (const witness of witnesses) {
      const d: number | undefined = displacement(witness.coordinate, rho);
      if (d === undefined) return undefined;
      observations.push({ t: witness.t, d });
    }
    observations.push({ t: domain[1], d: 0 });
    let maximum: number = measured[1];
    const located: Observation[] = [];
    for (let i: number = 1; i + 1 < observations.length; ++i) {
      const before: Observation = observations[i - 1]!;
      const middle: Observation = observations[i]!;
      const after: Observation = observations[i + 1]!;
      if (
        Math.abs(middle.d) >= Math.abs(before.d) &&
        Math.abs(middle.d) >= Math.abs(after.d) &&
        (Math.abs(middle.d) > Math.abs(before.d) ||
          Math.abs(middle.d) > Math.abs(after.d))
      ) {
        const found: Observation | undefined = peak(before, middle, after, rho);
        if (found === undefined) return undefined;
        located.push(found);
        maximum = Math.max(maximum, Math.abs(found.d));
      }
    }
    if (maximum <= measured[1] + roundoffMm) return [rho, maximum];
    let added: boolean = false;
    for (const found of located) {
      if (witnesses.some((witness: Witness): boolean => witness.t === found.t))
        continue;
      const value: Coordinate | undefined = coordinate(found.t);
      if (value === undefined) return undefined;
      witnesses.push({ t: found.t, coordinate: value });
      added = true;
    }
    if (!added) return undefined;
  }
  return undefined;
}
