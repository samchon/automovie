import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { MotionTrajectoryRead } from "./MotionTrajectoryRead";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import type { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * The adaptive Dormand-Prince 5(4) builder of integrateMotionTrajectory.
 * Shared rotation algebra and completed numeric readers have separate owners.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its formula, its order and its source.
 * @evidence contracts/development/design.md#principled-representation The orientation advanced in the Lie algebra of rotations, a rotation vector relative to a step's start, by Runge-Kutta-Munthe-Kaas; the vector state and that vector share one tableau, one error norm and one continuous extension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The integrator alone calls this adaptive builder; shared rotation algebra and completed numeric playback each have their existing separate owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The adaptive path is opt-in, so the fixed grid's every number stays as it was for every caller that does not ask for it.
 */
export namespace MotionTrajectoryStepper {
  const { turn, dexpinv }: typeof MotionTrajectoryRotation =
    MotionTrajectoryRotation;

  /**
   * The Dormand-Prince 5(4) pair's nodes, its stages' coefficients (the last
   * row its fifth-order weights, so the last stage is the next step's first)
   * and the difference of its fifth- and fourth-order weights, the step's
   * error estimate (Dormand and Prince 1980, J Comput Appl Math 6:19-26),
   * each read digit by digit from Hairer and Wanner's DOPRI5 code, its
   * subroutine CDOPRI's `c`, `a` and `e`, as the MESA project's port
   * `num/private/mod_dopri5.f` carries it
   * (https://mesastar.org/mesa/num/private/mod_dopri5.f.gcov.html); the
   * coefficients that code leaves out (`a72`, `e2`) are zero.
   */
  const C: readonly number[] = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];

  /** The stages' coefficients, row `i` for stage `i + 1`. */
  const A: readonly (readonly number[])[] = [
    [],
    [1 / 5],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
  ];

  /** The fifth-order weights less the fourth-order ones. */
  const E: readonly number[] = [
    71 / 57600,
    0,
    -71 / 16695,
    71 / 1920,
    -17253 / 339200,
    22 / 525,
    -1 / 40,
  ];

  /**
   * The continuous extension's fourth-order coefficients, read digit by
   * digit from the same code's `d` (its `d2` left out, zero), used as its
   * DOPCOR stores the dense output and CONTD5 reads it: with `ydiff` the
   * step's change and `bspl = h k1 - ydiff`, the terms `ydiff`, `bspl`,
   * `ydiff - h k7 - bspl` and `h Σ dⱼ kⱼ`, read at the step's share `θ` as
   * `θ (ydiff + (1 - θ)(bspl + θ (term3 + (1 - θ) term4)))`.
   */
  const D: readonly number[] = [
    -12715105075 / 11282082432,
    0,
    87487479700 / 32700410799,
    -10690763975 / 1880347072,
    701980252875 / 199316789632,
    -1453857185 / 822651844,
    69997945 / 29380423,
  ];

  /**
   * The step controller, as the same code's DOPCOR defaults and applies it,
   * read there line by line: the safety factor `safe`, the bounds `fac1`
   * and `fac2` on a step's change, the stabilizing exponent `beta` on the
   * last accepted error, the floor `previous` on that error (its `facold`,
   * which also starts there), and the share `stretch` of a step past which
   * the last one is taken to the end at once (its `1.01`).
   */
  const CONTROL: Readonly<{
    safety: number;
    least: number;
    most: number;
    beta: number;
    previous: number;
    stretch: number;
  }> = {
    safety: 0.9,
    least: 0.2,
    most: 10,
    beta: 0.04,
    previous: 1e-4,
    stretch: 1.01,
  };

  /**
   * A trajectory by the Dormand-Prince 5(4) pair under error control: each
   * step's error estimate, the difference of its two orders, is weighed
   * component by component against `absolute + relative × |value|` (the
   * vector state's larger of its two ends, as DOPCOR weighs it; the
   * orientation's rotation vector over the step by its length, this
   * module's extension of the same norm to the Lie algebra) in the
   * root-mean-square norm, a step is accepted when that norm is at most one,
   * and the next step follows DOPCOR's controller (`CONTROL`); a read between
   * knots is the pair's continuous extension of order four, the orientation
   * the step's start turned by its rotation vector's extension.
   * With an explicit vector partition, each same-unit block uses its
   * Euclidean error and endpoint norms; the maximum of those errors and
   * the orientation's original RMS controls admission. Zero error at zero
   * scale is zero; nonzero error there rejects without an absolute floor.
   *
   * @param props The integrator's props, with a tolerance.
   * @param rate The callback with the wrapper's vector-length and required-angular-rate presence checks; finite numeric components remain a caller premise.
   * @param step The first step tried, seconds, positive.
   * @returns The trajectory, its knots the accepted steps' ends.
   * @throws {Error} When a step shrinks below the resolution of its time: a right-hand side the tolerance cannot follow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the accepted-error norm, dense interpolation, time units, callback-shape checks, finite-data caller premise and time-resolution failure.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the cited Dormand-Prince tableau and controller with the RKMK rotation-vector differential. The wrapper checks the finite forward interval, positive finite step, tolerance, partition, nonempty state shape, rate length and required angular-rate presence; x0, dx and w components are not checked for finiteness. Finite data and valid input orientation remain caller premises. The embedded estimate controls local step admission and does not certify a global physical error bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Form trial stages, measure their error, reject or retain the continuous extension, then expose binary-search sampling over accepted steps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tableau and controller constants retain their cited provenance; no fixture-specific time grid, cached answer or tolerance relaxation is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n vector components, A accepted and R rejected trials, integration adds O((A+R)(n+1)) vector and optional rotation work and six right-hand-side calls per trial after the initial call. Reusing the last stage removes one n-component six-term weighted sum and array per trial, and one exponential per oriented acceptance. Only oriented trials allocate rotation-rate scratch; only the last rotation vector is retained. Dense output is O(A(n+1)); a new time costs O(log A+n+1), and a repeated exact time still copies O(n+1) output components. The tolerance can require arbitrarily many steps before time-resolution failure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the accepted last stage as the next first stage. Its already computed vector state is the identical fifth-order weighted sum, and its orientation is the same exponential used for the normalized endpoint, so neither is recomputed. Stages one through five share one private rotation-vector workspace: turn and dexpinv read its components without retaining it. Stage six, error and dense sums get fresh vectors. An absent vector block shares its private empty state and empty coefficients without component arithmetic. Dense coefficients are stored once and the reader reuses its immediately preceding exact time without reintegration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One private three-component stage workspace is released on return or throw and never enters accepted records or callback inputs. Nonempty trial arrays die after rejection or acceptance; the last trial state becomes the accepted endpoint without mutation. A zero-dimensional state and its empty coefficients are shared privately, while public output is always fresh. The reader retains accepted steps, endpoint state and at most one previous numeric read for its lifetime. Retention grows with accepted-step count without a fixed byte bound; no external handle or task is acquired.
   */
  export function dormandPrince(
    props: integrateMotionTrajectory.IProps,
    rate: (
      t: number,
      x: readonly number[],
      q: IAutoMovieQuaternion | null,
    ) => integrateMotionTrajectory.IRate,
    step: number,
  ): integrateMotionTrajectory.ITrajectory {
    const { t0, t1 } = props;
    const { relative, absolute } = props.tolerance!;
    const controlled: number = props.x0.length;
    const blocks: readonly number[] | undefined = props.tolerance!.blocks;
    const oriented: boolean = props.q0 !== undefined;
    const first: number = Math.min(step, t1 - t0);
    const steps: MotionTrajectoryRead.IDenseStep[] = [];
    let t: number = t0;
    let x: number[] = [...props.x0];
    const emptyTerms: number[][] | undefined =
      controlled === 0 ? [] : undefined;
    let q: IAutoMovieQuaternion | null = oriented
      ? Quaternion.normalize(props.q0!)
      : null;
    let k1: integrateMotionTrajectory.IRate = rate(t, x, q);
    const stage: IAutoMovieVector3 | undefined = oriented
      ? { x: 0, y: 0, z: 0 }
      : undefined;
    let h: number = first;
    let rejected: boolean = false;
    let previous: number = CONTROL.previous;
    const exponent: number = 0.2 - CONTROL.beta * 0.75;
    while (t < t1) {
      const last: boolean = t + CONTROL.stretch * h - t1 > 0;
      if (last) h = t1 - t;
      if (0.1 * Math.abs(h) <= Math.abs(t) * Number.EPSILON || !(t + h > t))
        throw new Error(
          `integrateMotionTrajectory: the step shrank below the resolution of ${t} s`,
        );
      // The stages, the orientation's in the algebra from the step's start.
      const ks: integrateMotionTrajectory.IRate[] = [k1];
      const us: (IAutoMovieVector3 | undefined)[] | undefined = oriented
        ? [k1.w]
        : undefined;

      // The last stage uses the fifth-order weights A[6], so its input is
      // the endpoint itself. A pure RHS leaves that input unchanged.
      let xn: number[] = x;
      let endpointQ: IAutoMovieQuaternion | null = q;
      let r: IAutoMovieVector3 | undefined;
      for (let i: number = 1; i < 7; i++) {
        const row: readonly number[] = A[i]!;
        const xi: number[] =
          controlled === 0
            ? x
            : x.map(
                (v: number, c: number): number =>
                  v +
                  h *
                    row.reduce(
                      (s: number, a: number, j: number): number =>
                        s + a * ks[j]!.dx[c]!,
                      0,
                    ),
              );
        const vi: IAutoMovieVector3 | undefined = oriented
          ? sum(row, us!, h, i < 6 ? stage : undefined)
          : undefined;
        const qi: IAutoMovieQuaternion | null = oriented ? turn(q, vi) : null;
        const ki: integrateMotionTrajectory.IRate = rate(t + C[i]! * h, xi, qi);
        if (i === 6) {
          xn = xi;
          endpointQ = qi;
          r = vi;
        }
        ks.push(ki);
        if (oriented) us!.push(dexpinv(vi, ki.w));
      }

      // Block norms cannot dilute the orientation's existing three-component
      // RMS. Without blocks, preserve the original componentwise arithmetic.
      let squares: number = 0;
      let blockError: number = 0;
      if (blocks === undefined) {
        for (let c: number = 0; c < controlled; c++) {
          const e: number =
            h *
            E.reduce(
              (s: number, w: number, j: number): number =>
                s + w * ks[j]!.dx[c]!,
              0,
            );
          squares += ratio(
            e,
            absolute + relative * Math.max(Math.abs(x[c]!), Math.abs(xn[c]!)),
          );
        }
      } else {
        let c: number = 0;
        for (const width of blocks) {
          let error: number = 0;
          let from: number = 0;
          let to: number = 0;
          for (let i: number = 0; i < width; i++, c++) {
            const e: number =
              h *
              E.reduce(
                (s: number, w: number, j: number): number =>
                  s + w * ks[j]!.dx[c]!,
                0,
              );
            error = Math.hypot(error, e);
            from = Math.hypot(from, x[c]!);
            to = Math.hypot(to, xn[c]!);
          }
          const scale: number =
            Math.sqrt(width) * absolute + relative * Math.max(from, to);
          blockError = Math.max(blockError, Math.sqrt(ratio(error, scale)));
        }
      }
      let rotationSquares: number = 0;
      if (oriented) {
        const e: IAutoMovieVector3 = sum(E, us!, h)!;
        const scale: number = absolute + relative * Vector3.length(r!);
        rotationSquares =
          ratio(e.x, scale) + ratio(e.y, scale) + ratio(e.z, scale);
      }
      const norm: number =
        blocks === undefined
          ? Math.sqrt(
              (squares + rotationSquares) / (controlled + (oriented ? 3 : 0)),
            )
          : Math.max(blockError, oriented ? Math.sqrt(rotationSquares / 3) : 0);
      const stretched: number = norm ** exponent;
      if (!(norm <= 1)) {
        h /= Math.min(1 / CONTROL.least, stretched / CONTROL.safety);
        rejected = true;
        continue;
      }
      const shrink: number = Math.max(
        1 / CONTROL.most,
        Math.min(
          1 / CONTROL.least,
          stretched / previous ** CONTROL.beta / CONTROL.safety,
        ),
      );
      const next: number = rejected ? Math.min(h / shrink, h) : h / shrink;
      previous = Math.max(norm, CONTROL.previous);

      // Accepted: keep the continuous extension and step on from the last stage.
      const k7: integrateMotionTrajectory.IRate = ks[6]!;
      const terms: number[][] =
        emptyTerms ??
        x.map((v: number, c: number): number[] => {
          const diff: number = xn[c]! - v;
          const spline: number = h * ks[0]!.dx[c]! - diff;
          return [
            diff,
            spline,
            diff - h * k7.dx[c]! - spline,
            h *
              D.reduce(
                (s: number, d: number, j: number): number =>
                  s + d * ks[j]!.dx[c]!,
                0,
              ),
          ];
        });
      const turns: IAutoMovieVector3[] = [];
      if (oriented) {
        const diff: IAutoMovieVector3 = r!;
        const spline: IAutoMovieVector3 = Vector3.subtract(
          Vector3.scale(us![0]!, h),
          diff,
        );
        turns.push(
          diff,
          spline,
          Vector3.subtract(
            Vector3.subtract(diff, Vector3.scale(us![6]!, h)),
            spline,
          ),
          sum(D, us!, h)!,
        );
      }
      steps.push({ t, h, x, terms, q, turns });
      t = last ? t1 : t + h;
      x = xn;
      q = oriented ? Quaternion.normalize(endpointQ!) : null;
      k1 = k7;
      rejected = false;
      h = next;
    }

    return MotionTrajectoryRead.dense(t0, t1, first, steps, { x, q });
  }

  /**
   * A weighted sum of rotation-vector rates times a step: `h Σ wⱼ uⱼ`.
   *
   * @param weights The weights, as many as the rates or fewer.
   * @param us The rates.
   * @param h The step.
   * @param out An exclusively owned workspace, absent from rates, callback
   *   inputs and dense records; omitted where the result must be retained.
   * @returns The workspace or a fresh vector, or undefined without orientation.
   */
  function sum(
    weights: readonly number[],
    us: readonly (IAutoMovieVector3 | undefined)[],
    h: number,
    out?: IAutoMovieVector3,
  ): IAutoMovieVector3 | undefined {
    if (us[0] === undefined) return undefined;
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    weights.forEach((w: number, j: number): void => {
      if (w === 0) return;
      x += w * us[j]!.x;
      y += w * us[j]!.y;
      z += w * us[j]!.z;
    });
    if (out === undefined) return { x: h * x, y: h * y, z: h * z };
    out.x = h * x;
    out.y = h * y;
    out.z = h * z;
    return out;
  }

  /**
   * One component's squared share of the error norm, zero for no error.
   *
   * @param e The component's error estimate.
   * @param scale Its tolerance.
   * @returns `(e / scale)²`, zero when `e` is zero.
   */
  function ratio(e: number, scale: number): number {
    return e === 0 ? 0 : (e / scale) ** 2;
  }
}
