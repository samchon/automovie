import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { MotionTrajectoryDense } from "./MotionTrajectoryDense";
import { MotionTrajectoryFailure } from "./MotionTrajectoryFailure";
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Adaptive stepping remains opt-in and fixed requests keep their explicit grid; exact endpoint differential matching is shared by both numeric readers without changing generic RMS budgets.
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
   * An explicit physical rotation defect additionally uses the paired
   * quintic continuous extension and its actual angular derivative. Its
   * normalized error is combined by max with the unchanged RMS criterion.
   *
   * @param props The integrator's props, with a tolerance.
   * @param rate The callback with the wrapper's vector-length and required-angular-rate presence checks; finite numeric components remain a caller premise.
   * @param step The first step tried, seconds, positive.
   * @returns The trajectory, its knots the accepted steps' ends.
   * @throws {MotionTrajectoryFailure} When the existing time-resolution guard catches the attempted step, including its roundoff margin, with the last rejected estimates and optional physical probe. Foreign model errors propagate unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the accepted-error norm, dense interpolation, time units, callback-shape checks, finite-data caller premise and time-resolution failure.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the cited DP tableau/controller and generic RMS or explicit block norm. The tableau identities sum(A_i)=C_i and sum(E)=0 express stage/error sums as a common first rate plus rate differences, removing coefficient-sum roundoff on constant RHS without changing a budget. MotionTrajectoryDense matches body slopes through Jr^-1 and optionally checks paired quintics in physical units. This does not remove every binary64 cancellation floor or certify global error and arbitrary histories.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Form trial stages, measure their error, reject or retain the continuous extension, then expose binary-search sampling. An unresolvable step reports the last rejected estimates without changing admission or adding a runtime observer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tableau and controller constants retain their cited provenance; no fixture-specific time grid, cached answer or tolerance relaxation is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each trial has six new RHS stages after the initial call and O(n+1) scalar/rotation work. Physical dense control adds four RHS evaluations on RMS-admitted trials and model probes at method nodes and paired component extrema. Numeric output is O(A(n+1)) for A accepted steps; full reads cost O(log A+n+1), quaternion projection O(log A). No fixed accepted-step bound exists before time-resolution failure.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the accepted last stage as the next first stage. Its already computed vector state is the identical fifth-order weighted sum, and its orientation is the same exponential used for the normalized endpoint, so neither is recomputed. Stages one through five share one private rotation-vector workspace: turn and dexpinv read its components without retaining it. Stage six, error and dense sums get fresh vectors. An absent vector block shares its private empty state and empty coefficients without component arithmetic. Dense coefficients are stored once and the reader reuses its immediately preceding exact time without reintegration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One private three-component stage workspace never enters callback inputs or accepted records. One FSAL quaternion reference keeps the raw input of the retained rate, before knot normalization. Rejected trial arrays release; one constant-size numeric rejection record copies its actual angular RHS endpoints and failed probe only on rejection, then replaces or clears them on the next rejection or acceptance. It escapes only on time exhaustion, holding no dense step, RHS or history. Accepted numeric steps, endpoint and bounded previous full/q/interval reads live with playback. Empty states/coefficients share private records while public output is fresh. Accepted-step storage has no fixed byte bound and no external handle is acquired.
   */
  export function dormandPrince(
    props: IAutoMovieIntegrateMotionTrajectory.IProps,
    rate: (
      t: number,
      x: readonly number[],
      q: IAutoMovieQuaternion | null,
    ) => IAutoMovieIntegrateMotionTrajectory.IRate,
    step: number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const { t0, t1 } = props;
    const { relative, absolute } = props.tolerance!;
    const controlled: number = props.x0.length;
    const blocks: readonly number[] | undefined = props.tolerance!.blocks;
    const oriented: boolean = props.q0 !== undefined;
    let first: number = Math.min(step, t1 - t0);
    let initial: boolean = true;
    const steps: MotionTrajectoryRead.IDenseStep[] = [];
    let t: number = t0;
    let x: number[] = [...props.x0];
    const emptyTerms: number[][] | undefined =
      controlled === 0 ? [] : undefined;
    let q: IAutoMovieQuaternion | null = oriented
      ? Quaternion.normalize(props.q0!)
      : null;
    let k1: IAutoMovieIntegrateMotionTrajectory.IRate = rate(t, x, q);
    let rateQ: IAutoMovieQuaternion | null = q;
    const stage: IAutoMovieVector3 | undefined = oriented
      ? { x: 0, y: 0, z: 0 }
      : undefined;
    let h: number = first;
    let rejected: boolean = false;
    let previous: number = CONTROL.previous;
    let rejection: MotionTrajectoryFailure["rejection"];
    const exponent: number = 0.2 - CONTROL.beta * 0.75;
    while (t < t1) {
      let last: boolean = t + CONTROL.stretch * h - t1 > 0;
      if (last) h = t1 - t;
      if (props.partition !== undefined) {
        const end: number = props.partition.end(t, last ? t1 : t + h);
        h = end - t;
        last = end === t1;
      }
      if (initial) {
        first = h;
        initial = false;
      }
      if (0.1 * Math.abs(h) <= Math.abs(t) * Number.EPSILON || !(t + h > t))
        throw new MotionTrajectoryFailure(t, h, rejection, props.errorScope);
      // Tableau consistency sum(A_i)=C_i preserves a common stage exactly;
      // sum(E)=0 gives the same stable difference form for embedded error.
      const ks: IAutoMovieIntegrateMotionTrajectory.IRate[] = [k1];
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
            : x.map((v: number, c: number): number => {
                const base: number = ks[0]!.dx[c]!;
                let increment: number = C[i]! * base;
                for (let j: number = 1; j < row.length; j++)
                  if (row[j] !== 0) increment += row[j]! * (ks[j]!.dx[c]! - base);
                return v + h * increment;
              });
        const vi: IAutoMovieVector3 | undefined = oriented
          ? sum(row, us!, h, C[i]!, i < 6 ? stage : undefined)
          : undefined;
        const qi: IAutoMovieQuaternion | null = oriented ? turn(q, vi) : null;
        const ki: IAutoMovieIntegrateMotionTrajectory.IRate = rate(t + C[i]! * h, xi, qi);
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
                s + w * (ks[j]!.dx[c]! - ks[0]!.dx[c]!),
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
                  s + w * (ks[j]!.dx[c]! - ks[0]!.dx[c]!),
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
        // The embedded weights sum to zero mathematically. Differencing
        // their shared first stage avoids a spurious defect for constant rates.
        const e: IAutoMovieVector3 = sum(E, us!, h, 0)!;
        const scale: number = absolute + relative * Vector3.length(r!);
        rotationSquares =
          ratio(e.x, scale) + ratio(e.y, scale) + ratio(e.z, scale);
      }
      let norm: number =
        blocks === undefined
          ? Math.sqrt(
              (squares + rotationSquares) / (controlled + (oriented ? 3 : 0)),
            )
          : Math.max(blockError, oriented ? Math.sqrt(rotationSquares / 3) : 0);
      let dense: MotionTrajectoryRead.IDenseStep | undefined;
      const rms: number = norm;
      let physical: number | undefined;
      let kind: NonNullable<MotionTrajectoryFailure["rejection"]>["kind"] = "rms";
      let probe: NonNullable<MotionTrajectoryFailure["rejection"]>["probe"];
      if (norm <= 1) {
        const built: ReturnType<typeof MotionTrajectoryDense> = MotionTrajectoryDense({
          t, h, x, q, end: xn, rotation: r, stages: ks, algebra: us,
          empty: emptyTerms, rate, defect: props.rotationDefect,
        });
        if (built === null) {
          norm = Infinity;
          kind = "numeric-dense";
        }
        else {
          dense = built.step;
          physical = built.error;
          probe = built.probe;
          kind = "physical";
          norm = Math.max(norm, built.error);
        }
      }
      const stretched: number = norm ** exponent;
      if (!(norm <= 1)) {
        rejection = { step: h, rms, physical, kind, probe,
          start: oriented ? {
            q: { x: rateQ!.x, y: rateQ!.y, z: rateQ!.z, w: rateQ!.w },
            w: { x: ks[0]!.w!.x, y: ks[0]!.w!.y, z: ks[0]!.w!.z },
          } : undefined,
          end: oriented ? {
            q: { x: endpointQ!.x, y: endpointQ!.y, z: endpointQ!.z, w: endpointQ!.w },
            w: { x: ks[6]!.w!.x, y: ks[6]!.w!.y, z: ks[6]!.w!.z },
          } : undefined };
        const reduced: number = h / Math.min(1 / CONTROL.least, stretched / CONTROL.safety);
        if (props.partition !== undefined && !props.partition.split(t, reduced))
          throw new MotionTrajectoryFailure(t, reduced, rejection, props.errorScope);
        h = reduced;
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
      const k7: IAutoMovieIntegrateMotionTrajectory.IRate = ks[6]!;
      steps.push(dense!);
      t = last ? t1 : t + h;
      x = xn;
      q = oriented ? Quaternion.normalize(endpointQ!) : null;
      k1 = k7;
      rateQ = endpointQ;
      rejected = false;
      rejection = undefined;
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
   * @param total The exact mathematical weight sum from the tableau, C_i or zero.
   * @param out An exclusively owned workspace, absent from rates, callback
   *   inputs and dense records; omitted where the result must be retained.
   * @returns The workspace or a fresh vector, or undefined without orientation.
   */
  function sum(
    weights: readonly number[],
    us: readonly (IAutoMovieVector3 | undefined)[],
    h: number,
    total: number,
    out?: IAutoMovieVector3,
  ): IAutoMovieVector3 | undefined {
    if (us[0] === undefined) return undefined;
    const origin: IAutoMovieVector3 = us[0];
    let x: number = total * origin.x;
    let y: number = total * origin.y;
    let z: number = total * origin.z;
    weights.forEach((w: number, j: number): void => {
      if (w === 0) return;
      x += w * (us[j]!.x - origin.x);
      y += w * (us[j]!.y - origin.y);
      z += w * (us[j]!.z - origin.z);
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
