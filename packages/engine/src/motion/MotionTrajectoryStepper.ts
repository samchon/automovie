import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * The steppers of {@link integrateMotionTrajectory} on the exponential map:
 * the orientation's turn by a rotation vector, the inverse differential of
 * the exponential, and the error-controlled Dormand-Prince 5(4) path with
 * its dense output.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its formula, its order and its source.
 * @evidence contracts/development/design.md#principled-representation The orientation advanced in the Lie algebra of rotations, a rotation vector relative to a step's start, by Runge-Kutta-Munthe-Kaas; the vector state and that vector share one tableau, one error norm and one continuous extension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the integrator's fixed and adaptive paths share, and the adaptive path itself; only the integrator reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The adaptive path is opt-in, so the fixed grid's every number stays as it was for every caller that does not ask for it.
 */
export namespace MotionTrajectoryStepper {
  /**
   * An orientation turned in its own frame by a rotation vector: `q * exp(v / 2)`, the rotation by `|v|` radians about `v` in the body's frame.
   *
   * @param q The orientation, or null for a state without one.
   * @param v The rotation vector, radians, body frame; absent for none.
   * @returns The turned orientation, or null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quaternion composition, body frame, radian input and missing-orientation result.
   * @evidence contracts/development/implementation.md#principled-implementation Converts the rotation-vector length to the degree unit Quaternion.fromAxisAngle accepts, then right-multiplies its exponential into the current orientation; integrator callers supply normalized orientations and finite vectors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Missing and zero turns preserve the input; the remaining path delegates axis-angle construction and quaternion composition to their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the supplied rotation vector without a fixture-specific axis or minimum angle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar and quaternion operations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scalar-sized calculation with no cross-request work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; a zero or absent turn returns the borrowed input.
   */
  export function turn(
    q: IAutoMovieQuaternion | null,
    v: IAutoMovieVector3 | undefined,
  ): IAutoMovieQuaternion | null {
    if (q === null || v === undefined) return q;
    const angle: number = Math.hypot(v.x, v.y, v.z);
    if (angle === 0) return q;
    return Quaternion.multiply(
      q,
      Quaternion.fromAxisAngle(v, (angle * 180) / Math.PI),
    );
  }

  /**
   * A vector scaled, or absent when absent.
   *
   * @param v The vector, or undefined.
   * @param s The scale.
   * @returns `s v`, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States component scaling and preservation of an absent vector.
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies all three components by the supplied scale; the caller owns its units and the finite-input premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One absence branch and one vector literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No replacement value is invented for an absent orientation rate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three multiplications with no input-sized traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No repeated request or retained calculation is coordinated.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned vector is caller-owned; no state or resource is retained.
   */
  export function scaled(
    v: IAutoMovieVector3 | undefined,
    s: number,
  ): IAutoMovieVector3 | undefined {
    return v === undefined ? undefined : { x: s * v.x, y: s * v.y, z: s * v.z };
  }

  /**
   * The derivative of a rotation vector `r` that turns the body at a body-frame
   * rate `w`, for an orientation `q exp(r)`: the inverse differential of the
   * exponential map, `w + r × w / 2 + r × (r × w) / 12`, its Bernoulli series
   * truncated after the second bracket, which keeps a Runge-Kutta-Munthe-Kaas
   * step of order 4, and of order 5 too, since the third Bernoulli number
   * that would enter next is zero (Munthe-Kaas 1999, "High order Runge-Kutta
   * methods on manifolds", Appl Numer Math 29:115-127; Iserles, Munthe-Kaas,
   * Nørsett and Zanna 2000, "Lie-group methods", Acta Numerica 9; the
   * truncation's order is checked here by the trajectory's own tests). The
   * signs are the body frame's: for `q̇ = q ŵ / 2`, the rate of `q exp(r)` is
   * `ṙ - r × ṙ / 2 + ...`, whose inverse this is.
   *
   * @param r The rotation vector, radians; absent for a state without orientation.
   * @param w The body-frame rate, radians per second.
   * @returns The vector's derivative, radians per second, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the body-frame inverse differential, angular units, truncated terms and absent-orientation behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the cited Bernoulli expansion through the double cross product with coefficients one half and one twelfth; this is the local RKMK series, not an exact inverse differential at arbitrary rotation-vector magnitude.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two shared cross products followed by componentwise accumulation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The coefficients are the stated series coefficients; missing orientation leaves the supplied rate unchanged rather than choosing a body axis.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size vector arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the first cross product in the double bracket and the shared Vector3.cross implementation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function retaining no input or intermediate between calls.
   */
  export function dexpinv(
    r: IAutoMovieVector3 | undefined,
    w: IAutoMovieVector3 | undefined,
  ): IAutoMovieVector3 | undefined {
    if (r === undefined || w === undefined) return w;
    const a: IAutoMovieVector3 = Vector3.cross(r, w);
    const b: IAutoMovieVector3 = Vector3.cross(r, a);
    return {
      x: w.x + a.x / 2 + b.x / 12,
      y: w.y + a.y / 2 + b.y / 12,
      z: w.z + a.z / 2 + b.z / 12,
    };
  }

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

  /** One accepted step's dense output. */
  interface IStep {
    /** Its start and length, seconds. */
    t: number;
    h: number;

    /** The vector state at its start and the five continuous-extension terms. */
    x: number[];
    terms: number[][];

    /** The orientation at its start and the rotation vector's five terms. */
    q: IAutoMovieQuaternion | null;
    turns: IAutoMovieVector3[];
  }

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
   *
   * @param props The integrator's props, with a tolerance.
   * @param rate The admitted right-hand side.
   * @param step The first step tried, seconds, positive.
   * @returns The trajectory, its knots the accepted steps' ends.
   * @throws {Error} When a step shrinks below the resolution of its time: a right-hand side the tolerance cannot follow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the accepted-error norm, dense interpolation, time units, admitted callback and time-resolution failure.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the cited Dormand-Prince tableau and controller with the RKMK rotation-vector differential; integrateMotionTrajectory admits the finite interval, initial state, tolerance and callback results. The embedded estimate controls local step admission and does not certify a global physical error bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Form trial stages, measure their error, reject or retain the continuous extension, then expose binary-search sampling over accepted steps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tableau and controller constants retain their cited provenance; no fixture-specific time grid, cached answer or tolerance relaxation is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms For n scalar components, A accepted and R rejected trials, integration adds O((A+R)n) vector work and six right-hand-side calls per trial after the initial call; retained dense output is O(An), and each read costs O(log A+n). The tolerance can require arbitrarily many steps before the time-resolution failure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the accepted last stage as the next first stage and stores dense coefficients once so repeated reads do not reintegrate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Trial arrays die after rejection or acceptance; the returned reader retains accepted steps and endpoint state for its lifetime. Retention grows with accepted-step count and has no fixed byte bound; the operation acquires no external handle or task.
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
    const oriented: boolean = props.q0 !== undefined;
    const n: number = props.x0.length;
    const first: number = Math.min(step, t1 - t0);
    const steps: IStep[] = [];
    let t: number = t0;
    let x: number[] = [...props.x0];
    let q: IAutoMovieQuaternion | null = oriented
      ? Quaternion.normalize(props.q0!)
      : null;
    let k1: integrateMotionTrajectory.IRate = rate(t, x, q);
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
      const us: (IAutoMovieVector3 | undefined)[] = [k1.w];
      const vs: (IAutoMovieVector3 | undefined)[] = [undefined];
      for (let i: number = 1; i < 7; i++) {
        const row: readonly number[] = A[i]!;
        const xi: number[] = x.map(
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
          ? sum(row, us, h)
          : undefined;
        const ki: integrateMotionTrajectory.IRate = rate(
          t + C[i]! * h,
          xi,
          turn(q, vi),
        );
        ks.push(ki);
        vs.push(vi);
        us.push(dexpinv(vi, ki.w));
      }
      const xn: number[] = x.map(
        (v: number, c: number): number =>
          v +
          h *
            A[6]!.reduce(
              (s: number, a: number, j: number): number =>
                s + a * ks[j]!.dx[c]!,
              0,
            ),
      );
      const r: IAutoMovieVector3 | undefined = vs[6];

      // The error norm, root mean square over the components.
      let squares: number = 0;
      for (let c: number = 0; c < n; c++) {
        const e: number =
          h *
          E.reduce(
            (s: number, w: number, j: number): number => s + w * ks[j]!.dx[c]!,
            0,
          );
        squares += ratio(
          e,
          absolute + relative * Math.max(Math.abs(x[c]!), Math.abs(xn[c]!)),
        );
      }
      if (oriented) {
        const e: IAutoMovieVector3 = sum(E, us, h)!;
        const scale: number = absolute + relative * Vector3.length(r!);
        squares += ratio(e.x, scale) + ratio(e.y, scale) + ratio(e.z, scale);
      }
      const norm: number = Math.sqrt(squares / (n + (oriented ? 3 : 0)));
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
      const terms: number[][] = x.map((v: number, c: number): number[] => {
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
          Vector3.scale(us[0]!, h),
          diff,
        );
        turns.push(
          diff,
          spline,
          Vector3.subtract(
            Vector3.subtract(diff, Vector3.scale(us[6]!, h)),
            spline,
          ),
          sum(D, us, h)!,
        );
      }
      steps.push({ t, h, x, terms, q, turns });
      t = last ? t1 : t + h;
      x = xn;
      q = oriented ? Quaternion.normalize(turn(q, r)!) : null;
      k1 = k7;
      rejected = false;
      h = next;
    }

    const times: number[] = [...steps.map((s: IStep): number => s.t), t1];
    const end: integrateMotionTrajectory.IState = { x, q };
    return {
      t0,
      t1,
      h: first,
      knots: times.length,
      times,
      at: (time: number): integrateMotionTrajectory.IState => {
        if (!(time < t1)) return { x: [...end.x], q: end.q };
        const at: number = Math.max(t0, time);
        let lo: number = 0;
        let hi: number = steps.length - 1;
        while (lo < hi) {
          const mid: number = (lo + hi + 1) >> 1;
          if (steps[mid]!.t <= at) lo = mid;
          else hi = mid - 1;
        }
        const s: IStep = steps[lo]!;
        const u: number = (at - s.t) / s.h;
        const w: number = 1 - u;
        const along = (a: number, b: number, c: number, d: number): number =>
          u * (a + w * (b + u * (c + w * d)));
        return {
          x: s.x.map(
            (v: number, c: number): number =>
              v +
              along(
                s.terms[c]![0]!,
                s.terms[c]![1]!,
                s.terms[c]![2]!,
                s.terms[c]![3]!,
              ),
          ),
          q:
            s.q === null
              ? null
              : turn(s.q, {
                  x: along(
                    s.turns[0]!.x,
                    s.turns[1]!.x,
                    s.turns[2]!.x,
                    s.turns[3]!.x,
                  ),
                  y: along(
                    s.turns[0]!.y,
                    s.turns[1]!.y,
                    s.turns[2]!.y,
                    s.turns[3]!.y,
                  ),
                  z: along(
                    s.turns[0]!.z,
                    s.turns[1]!.z,
                    s.turns[2]!.z,
                    s.turns[3]!.z,
                  ),
                }),
        };
      },
    };
  }

  /**
   * A weighted sum of rotation-vector rates times a step: `h Σ wⱼ uⱼ`.
   *
   * @param weights The weights, as many as the rates or fewer.
   * @param us The rates.
   * @param h The step.
   * @returns The vector, or undefined for a state without orientation.
   */
  function sum(
    weights: readonly number[],
    us: readonly (IAutoMovieVector3 | undefined)[],
    h: number,
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
    return { x: h * x, y: h * y, z: h * z };
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
