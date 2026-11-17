import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { polynomialUnitRoots } from "../math/polynomialUnitRoots";
import { rotationVectorJacobian } from "../math/rotationVectorJacobian";
import type { MotionTrajectoryFailure } from "./MotionTrajectoryFailure";
import { MotionTrajectoryPolynomial } from "./MotionTrajectoryPolynomial";
import type { MotionTrajectoryRead } from "./MotionTrajectoryRead";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import type { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/** DOPRI5's original continuous-extension weights, from Hairer/Wanner CDOPRI. */
const D: readonly number[] = [-12715105075 / 11282082432, 0,
  87487479700 / 32700410799, -10690763975 / 1880347072,
  701980252875 / 199316789632, -1453857185 / 822651844, 69997945 / 29380423];

/** Numeric coordinate names of a body-frame rotation vector. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/**
 * Build a C1 dense step, optionally controlled by a paired physical defect.
 *
 * With rotationDefect, Enright and Hayes (2007), section 2.2, supply two
 * additional nodes .86/.93: the quartic supplies their first states, a
 * quintic u supplies their recomputed states, and the same constraints build
 * quintic v. See https://www.cs.toronto.edu/~wayne/research/papers/enright.pdf.
 * Both extensions are tested at method nodes and component extrema of their
 * value/derivative difference. These are error-estimator probes, not a
 * continuous certificate for an arbitrary black-box physical history.
 * Factoring known stationary endpoints preserves the real polynomial's
 * stationary set; rounded interior probes and accepted steps can differ
 * from isolation of the expanded floating-point coefficients.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the paired construction, exact endpoint differential, normalized physical quantity, probe selection, estimator limitations and optional failed-probe snapshot.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps DP5 endpoint/RMS and matches endpoint body rates through Jr^-1. Continuous-extension weights sum to zero, so differences from the first stage exactly annihilate a constant stage array without coefficient-sum noise. Paired Hermite-Birkhoff u/v use the cited derivative nodes and recomputation; actual body velocity is Jr(r)r'. Physical units and smoothness remain caller/estimator premises, without a continuous certificate or invented absolute floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the original numeric quartic with C1 slopes, form the paired quintics only when requested, then test physical defects before accepting v.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance division, fixed step cap, midpoint-only admission or scene-specific grid is introduced. Polynomial extrema supplement method nodes without sampling a guessed time table; unresolved numeric/chart data rejects the trial.
 * @evidence contracts/development/implementation.md#efficient-algorithms For n states builds O(n) coefficients. Physical mode adds four RHS evaluations, and model probes at a finite union of method nodes and quadratic/cubic component roots. Factoring the known endpoint zeros avoids quartic isolation and cancellation of an expanded endpoint root. A failed physical probe rejects immediately; accepted trials check every probe on both curves. Actual shape cost belongs to the callback.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the seven existing stages, endpoint state and fixed Hermite-Birkhoff weights. The paired difference's known stationary endpoints are already method nodes, so only its remaining quadratic factor needs root isolation. At each probe time both curves still compute and admit their numeric q/body-rate; only when all seven components are Object.is-equal does the second reuse the pure physical callback's scalar. Otherwise history alone may share that exact time's sufficient statistics.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The numeric step and, only after a failed physical probe, its copied time/q/body-rate/error record escape. No probe snapshot is copied on acceptance. Stages, paired temporary coefficients, root arrays, callbacks and sampled states release after this synchronous build; no raw model history is captured by playback or the numeric refusal context.
 */
export function MotionTrajectoryDense(props: {
  /** Step start, seconds. */
  t: number;
  /** Step duration, seconds. */
  h: number;
  /** Owned start vector, borrowed without mutation. */
  x: number[];
  /** Start unit orientation, or null. */
  q: IAutoMovieQuaternion | null;
  /** The already computed DP5 endpoint vector. */
  end: number[];
  /** Endpoint algebra vector, absent without orientation. */
  rotation: IAutoMovieVector3 | undefined;
  /** The seven original RHS stages. */
  stages: readonly integrateMotionTrajectory.IRate[];
  /** Their algebra derivatives, absent without orientation. */
  algebra: readonly (IAutoMovieVector3 | undefined)[] | undefined;
  /** Optional shared empty coefficients for a zero-dimensional vector. */
  empty?: number[][];
  /** The admitted pure RHS, used for four paired-extension probes. */
  rate: integrateMotionTrajectory.IProps["f"];
  /** Optional caller-owned normalized physical rotation defect. */
  defect: integrateMotionTrajectory.IProps["rotationDefect"];
}): {
  /** Numeric continuous extension with no callbacks. */
  step: MotionTrajectoryRead.IDenseStep;
  /** Largest checked normalized defect, or the first value that rejects. */
  error: number;
  /** Owned first failing physical probe; absent on acceptance or numeric rejection. */
  probe?: NonNullable<MotionTrajectoryFailure["rejection"]>["probe"];
} | null {
  const { t, h, x, q, end, stages }: typeof props = props;
  const terms: number[][] = props.empty ?? x.map((value: number, c: number): number[] => {
    const diff: number = end[c]! - value;
    const spline: number = h * stages[0]!.dx[c]! - diff;
    return [diff, spline, diff - h * stages[6]!.dx[c]! - spline,
      h * D.reduce((sum: number, d: number, j: number): number => sum + d * (stages[j]!.dx[c]! - stages[0]!.dx[c]!), 0)];
  });
  const turns: IAutoMovieVector3[] = [];
  if (q !== null) {
    const r: IAutoMovieVector3 = props.rotation!;
    const slope: IAutoMovieVector3 | null = rotationVectorJacobian.inverse(r, stages[6]!.w!);
    if (slope === null) return null;
    const spline: IAutoMovieVector3 = {
      x: h * stages[0]!.w!.x - r.x, y: h * stages[0]!.w!.y - r.y, z: h * stages[0]!.w!.z - r.z,
    };
    const last: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const firstAlgebra: IAutoMovieVector3 = props.algebra![0]!;
    D.forEach((weight: number, j: number): void => {
      if (weight === 0) return;
      last.x += weight * (props.algebra![j]!.x - firstAlgebra.x);
      last.y += weight * (props.algebra![j]!.y - firstAlgebra.y);
      last.z += weight * (props.algebra![j]!.z - firstAlgebra.z);
    });
    turns.push(r, spline, {
      x: r.x - h * slope.x - spline.x,
      y: r.y - h * slope.y - spline.y,
      z: r.z - h * slope.z - spline.z,
    }, { x: h * last.x, y: h * last.y, z: h * last.z });
  }
  const base: MotionTrajectoryRead.IDenseStep = { t, h, x, q, terms, turns };
  if (!finite(base)) return null;
  if (props.defect === undefined) return { step: base, error: 0 };
  const defect: NonNullable<integrateMotionTrajectory.IProps["rotationDefect"]> = props.defect;

  /** One fresh RHS reading and its exact algebra derivative at a probe. */
  interface ISample {
    /** Vector/body rate from the actual RHS. */
    rate: integrateMotionTrajectory.IRate;
    /** Exact coordinate derivative of the probe's body rate. */
    algebra: IAutoMovieVector3;
  }
  const sample: (step: MotionTrajectoryRead.IDenseStep, u: number) => ISample | null = (
    step: MotionTrajectoryRead.IDenseStep, u: number,
  ): ISample | null => {
    const r: IAutoMovieVector3 = MotionTrajectoryRotation.curve(step.turns, u);
    const orientation: IAutoMovieQuaternion = MotionTrajectoryRotation.turn(q, r)!;
    const state: number[] = x.length === 0 ? x : step.terms.map((c: number[], i: number): number =>
      x[i]! + MotionTrajectoryPolynomial.value(u, c[0]!, c[1]!, c[2]!, c[3]!, c[4]));
    if (!finiteQuaternion(orientation) || !state.every(Number.isFinite)) return null;
    const rate: integrateMotionTrajectory.IRate = props.rate(t + u * h, state, orientation);
    const algebra: IAutoMovieVector3 | null = rotationVectorJacobian.inverse(r, rate.w!);
    return algebra === null || !rate.dx.every(Number.isFinite) ? null : { rate, algebra };
  };
  const fit: (left: ISample, right: ISample) => MotionTrajectoryRead.IDenseStep = (
    left: ISample, right: ISample,
  ): MotionTrajectoryRead.IDenseStep => {
    const vector: number[][] = x.length === 0 ? terms : terms.map((c: number[], i: number): number[] =>
      MotionTrajectoryPolynomial.fit(c[0]!, c[1]!, c[2]!, h * left.rate.dx[i]!, h * right.rate.dx[i]!));
    const columns: number[][] = AXES.map((axis: "x" | "y" | "z"): number[] =>
      MotionTrajectoryPolynomial.fit(turns[0]![axis], turns[1]![axis], turns[2]![axis], h * left.algebra[axis], h * right.algebra[axis]));
    return { t, h, x, q, terms: vector,
      turns: Array.from({ length: 5 }, (_: unknown, i: number): IAutoMovieVector3 => ({ x: columns[0]![i]!, y: columns[1]![i]!, z: columns[2]![i]! })) };
  };
  const left: ISample | null = sample(base, MotionTrajectoryPolynomial.NODES[0]);
  const right: ISample | null = sample(base, MotionTrajectoryPolynomial.NODES[1]);
  if (left === null || right === null) return null;
  const u: MotionTrajectoryRead.IDenseStep = fit(left, right);
  if (!finite(u)) return null;
  const refinedLeft: ISample | null = sample(u, MotionTrajectoryPolynomial.NODES[0]);
  const refinedRight: ISample | null = sample(u, MotionTrajectoryPolynomial.NODES[1]);
  if (refinedLeft === null || refinedRight === null) return null;
  const v: MotionTrajectoryRead.IDenseStep = fit(refinedLeft, refinedRight);
  if (!finite(v)) return null;

  // The extrema belong to the actual paired polynomials, not a time grid.
  const nodes: Set<number> = new Set([0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1,
    ...MotionTrajectoryPolynomial.NODES]);
  for (const axis of AXES) {
    const deltaD: number = u.turns[3]![axis] - v.turns[3]![axis];
    const deltaE: number = u.turns[4]![axis] - v.turns[4]![axis];
    if (!Number.isFinite(deltaD) || !Number.isFinite(deltaE)) return null;
    const scale: number = Math.max(Math.abs(deltaD), Math.abs(deltaE));
    if (scale === 0) continue;
    const d: number = deltaD / scale;
    const e: number = deltaE / scale;

    // The paired difference is u²(1-u)²(d+u*e). Its derivative factors as
    // u(1-u)[2d+(-4d+3e)u-5e*u²]; 0 and 1 are already method nodes.
    for (const root of polynomialUnitRoots([2 * d, -4 * d + 3 * e, -5 * e])) nodes.add(root);
    for (const root of polynomialUnitRoots([2 * d, -12 * d + 6 * e, 12 * d - 24 * e, 20 * e])) nodes.add(root);
  }
  let error: number = 0;
  for (const at of [...nodes].sort((a: number, b: number): number => a - b)) {
    let previousQ: IAutoMovieQuaternion | undefined;
    let previousW: IAutoMovieVector3 | undefined;
    let previousError: number = 0;
    for (const step of [u, v]) {
      const r: IAutoMovieVector3 = MotionTrajectoryRotation.curve(step.turns, at);
      const orientation: IAutoMovieQuaternion = MotionTrajectoryRotation.turn(q, r)!;
      const rate: IAutoMovieVector3 | null = rotationVectorJacobian.apply(r, MotionTrajectoryRotation.curveDerivative(step.turns, at, h));
      if (rate === null || !finiteQuaternion(orientation)) return null;
      const same: boolean = previousQ !== undefined && previousW !== undefined
        && Object.is(orientation.x, previousQ.x) && Object.is(orientation.y, previousQ.y)
        && Object.is(orientation.z, previousQ.z) && Object.is(orientation.w, previousQ.w)
        && Object.is(rate.x, previousW.x) && Object.is(rate.y, previousW.y) && Object.is(rate.z, previousW.z);
      const measured: number = same ? previousError : defect(t + at * h, orientation, rate);
      if (!(measured >= 0)) throw new Error("A continuous rotation defect must be nonnegative");
      previousQ = orientation;
      previousW = rate;
      previousError = measured;
      error = Math.max(error, measured);
      if (error > 1) return { step: v, error,
        probe: { time: t + at * h,
          q: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
          w: { x: rate.x, y: rate.y, z: rate.z }, error: measured } };
    }
  }
  return { step: v, error };
}

/** Admit finite numeric coefficients before invoking a physical callback. */
function finite(step: MotionTrajectoryRead.IDenseStep): boolean {
  return step.terms.every((c: number[]): boolean => c.every(Number.isFinite))
    && step.turns.every((v: IAutoMovieVector3): boolean => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z));
}

/** A malformed numerical trial rejects before it can look like a model error. */
function finiteQuaternion(q: IAutoMovieQuaternion): boolean {
  return Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z) && Number.isFinite(q.w);
}
