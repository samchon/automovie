import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import type { integrateMotionTrajectory } from "./integrateMotionTrajectory";
import { samplePoseVelocity } from "./samplePoseVelocity";

const { turn, dexpinv }: typeof MotionTrajectoryRotation =
  MotionTrajectoryRotation;

/**
 * Numeric trajectory readers constructed outside the integration callback's scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fixed Hermite and adaptive dense reads retain their original formulas and held endpoints.
 * @evidence contracts/development/design.md#principled-representation A completed trajectory owns numeric states and interpolation coefficients; every returned vector and orientation belongs to its read, and the reader has no right-hand side, model or shape-history input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two existing steppers each hand their completed numeric records to their corresponding reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The data records reuse the integrator's state/rate types; no motion is approximated anew or reintegrated at playback.
 */
export namespace MotionTrajectoryRead {
  /**
   * The completed fixed grid's numeric knots, states and endpoint derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish seconds, vector states, unit orientations and their endpoint rates.
   * @evidence contracts/development/design.md#principled-representation Parallel arrays describe the same completed knots, with a shortened final interval and a null quaternion for an absent orientation; the builder owns equal lengths and forward times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by integrateMotionTrajectory and consumed only by this file's fixed reader; no right-hand side or physical model is carried into playback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the integrator's rate type and stores actual computed knots, without a second curve or fitted result.
   */
  export interface IFixed {
    /** Interval start, seconds. */
    t0: number;

    /** Interval end, seconds. */
    t1: number;

    /** Fixed step, seconds. */
    h: number;

    /** The scalar knot times, including the shortened final step. */
    times: number[];

    /** The vector states at those knots. */
    xs: number[][];

    /** The orientations at those knots; null when absent. */
    qs: (IAutoMovieQuaternion | null)[];

    /** The vector and angular rates at those knots. */
    ks: integrateMotionTrajectory.IRate[];

    /** Whether the trajectory includes an orientation. */
    oriented: boolean;
  }

  /**
   * One accepted adaptive step's numeric continuous extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish step seconds, vector states, quaternion orientation and four dense correction coefficients.
   * @evidence contracts/development/design.md#principled-representation The DP5(4) extension's start state and four coefficients are numeric data; the builder owns their dimensions and positive step length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface MotionTrajectoryStepper produces accepted records and this file's dense reader owns them until playback is released.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback, body, history or second interpolation representation is stored in a completed step.
   */
  export interface IDenseStep {
    /** Step start, seconds. */
    t: number;

    /** Step duration, seconds. */
    h: number;

    /** Vector state at the start. */
    x: number[];

    /** Four correction coefficients per vector component. */
    terms: number[][];

    /** Start orientation, null when absent. */
    q: IAutoMovieQuaternion | null;

    /** Four body-frame rotation-vector coefficients. */
    turns: IAutoMovieVector3[];
  }

  /**
   * Read a completed fixed grid by its original cubic Hermite extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads between numeric knots in seconds, holds the interval's ends and returns caller-owned vector and orientation records.
   * @evidence contracts/development/implementation.md#principled-implementation Cubic Hermite of states and of the rotation vector, with both endpoint derivatives; the body-frame differential matches the construction stepper.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the interval by division, form the four Hermite weights, then read vector and orientation blocks. The last queried interval owns its time-independent rotation-vector endpoint and endpoint differential.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the fixed integrator's arithmetic and never reads its right-hand side.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time interval lookup and O(n+1) interpolation for n vector components. An immediately repeated exact requested time skips interpolation; every read still copies O(n+1) output components, and a different time constructs and copies its interpolated vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares completed knot arrays and one previous numeric state only when Object.is matches the raw requested time. All components share each Hermite slope weight times the interval span, with its original multiplication association. One previous oriented interval shares its relative rotation vector and endpoint differential, which depend only on immutable knot orientations and owned rate snapshots. Held-time and interpolation arithmetic are unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains supplied numeric knots, at most one previous numeric read and one interval's two three-component vectors and index for the reader's lifetime; no solver callback or history enters this factory. Fresh output vectors and orientations keep caller mutation outside all retained records.
   */
  export function fixed(props: IFixed): integrateMotionTrajectory.ITrajectory {
    const { t0, t1, h, times, xs, qs, ks, oriented }: IFixed = props;
    const steps: number = times.length - 1;

    // Knot orientations and retained rate snapshots are immutable here.
    // Only the queried interval's Hermite weights depend on the read time.
    let rotation:
      | {
          interval: number;
          vector: IAutoMovieVector3;
          endRate: IAutoMovieVector3;
        }
      | undefined;
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      at: owned((time: number): integrateMotionTrajectory.IState => {
        const t: number = Math.max(t0, Math.min(t1, time));
        const i: number = Math.min(steps - 1, Math.floor((t - t0) / h));
        const a: number = times[i]!;
        const span: number = times[i + 1]! - a;
        const u: number = (t - a) / span;
        const u2: number = u * u;
        const u3: number = u2 * u;
        const h00: number = 2 * u3 - 3 * u2 + 1;
        const h10: number = u3 - 2 * u2 + u;
        const h01: number = -2 * u3 + 3 * u2;
        const h11: number = u3 - u2;
        const slope0: number = h10 * span;
        const slope1: number = h11 * span;
        const x0: number[] = xs[i]!;
        const x1: number[] = xs[i + 1]!;
        const d0: readonly number[] = ks[i]!.dx;
        const d1: readonly number[] = ks[i + 1]!.dx;
        let q: IAutoMovieQuaternion | null = null;
        if (oriented && u >= 1) q = qs[i + 1]!;
        else if (oriented) {
          if (rotation === undefined || rotation.interval !== i) {
            const vector: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
              Quaternion.multiply(Quaternion.inverse(qs[i]!), qs[i + 1]!),
            );
            const endRate: IAutoMovieVector3 = dexpinv(vector, ks[i + 1]!.w)!;
            rotation = { interval: i, vector, endRate };
          }
          const w0: IAutoMovieVector3 = ks[i]!.w!;
          const r1: IAutoMovieVector3 = rotation.vector;
          const w1: IAutoMovieVector3 = rotation.endRate;
          q = turn(qs[i]!, {
            x: slope0 * w0.x + h01 * r1.x + slope1 * w1.x,
            y: slope0 * w0.y + h01 * r1.y + slope1 * w1.y,
            z: slope0 * w0.z + h01 * r1.z + slope1 * w1.z,
          });
        }
        return {
          x:
            x0.length === 0
              ? x0
              : x0.map(
                  (v: number, k: number): number =>
                    h00 * v + slope0 * d0[k]! + h01 * x1[k]! + slope1 * d1[k]!,
                ),
          q,
        };
      }),
    };
  }

  /**
   * Read accepted DP5(4) steps by their original fourth-order extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads numeric dense coefficients in seconds, holds the endpoints and returns caller-owned vector and orientation records.
   * @evidence contracts/development/implementation.md#principled-implementation The stepper supplies Dormand-Prince's four correction terms; their nested polynomial and exponential map are unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Binary-search the accepted interval and evaluate its vector and rotation polynomials.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shape samples, extra integration or replacement interpolation enter playback.
   * @evidence contracts/development/implementation.md#efficient-algorithms For A steps and n states a new time costs O(log A+n+1), including interpolation and output copying; an immediately repeated exact time skips lookup and interpolation but still copies O(n+1) output components. Retention is O(A(n+1)), plus one numeric read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Dense coefficients are shared by every read; one previous numeric state reuses lookup and polynomial work only for an Object.is-equal raw requested time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains accepted numeric steps, the endpoint and at most one previous numeric read. Every output vector and orientation is fresh; the builder's props and right-hand side are outside this factory's lexical scope.
   */
  export function dense(
    t0: number,
    t1: number,
    h: number,
    steps: readonly IDenseStep[],
    end: integrateMotionTrajectory.IState,
  ): integrateMotionTrajectory.ITrajectory {
    const times: number[] = [...steps.map((s: IDenseStep): number => s.t), t1];
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      at: owned((time: number): integrateMotionTrajectory.IState => {
        if (!(time < t1)) return { x: end.x, q: end.q };
        const at: number = Math.max(t0, time);
        let lo: number = 0;
        let hi: number = steps.length - 1;
        while (lo < hi) {
          const mid: number = (lo + hi + 1) >> 1;
          if (steps[mid]!.t <= at) lo = mid;
          else hi = mid - 1;
        }
        const s: IDenseStep = steps[lo]!;
        const u: number = (at - s.t) / s.h;
        const w: number = 1 - u;
        const along: (a: number, b: number, c: number, d: number) => number = (
          a: number,
          b: number,
          c: number,
          d: number,
        ): number => u * (a + w * (b + u * (c + w * d)));
        return {
          x:
            s.x.length === 0
              ? s.x
              : s.x.map(
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
      }),
    };
  }

  /**
   * Reuse one exact requested time behind the public read boundary. The
   * numeric result may borrow immutable records, but none escapes: each return
   * copies both mutable blocks. Store the key only after a successful read,
   * and distinguish signed zero without changing either reader's branches.
   */
  function owned(
    read: (seconds: number) => integrateMotionTrajectory.IState,
  ): (seconds: number) => integrateMotionTrajectory.IState {
    let previous: number | undefined;
    let value: integrateMotionTrajectory.IState | undefined;
    return (seconds: number): integrateMotionTrajectory.IState => {
      if (value === undefined || !Object.is(seconds, previous)) {
        value = read(seconds);
        previous = seconds;
      }
      return { x: [...value.x], q: value.q === null ? null : { ...value.q } };
    };
  }
}
