import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmGeometry } from "../posture/HumanArmGeometry";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContext } from "../posture/HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * A planned arm that follows a person who moves: the feed-forward plan
 * (`AutoMovieMotionHumanArmPlanned.planned`, the person as perceived when it
 * was made) plus a feedback correction driven only by how far the goal has
 * moved since the plan perceived it (`AutoMovieMotionHumanArmPlanned.moved`),
 * mapped onto the arm by differential inverse kinematics and moved no faster
 * than the audit's travel bound leaves the plan room for.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is followed, what drives the correction, how it maps onto the arm and its bound.
 * @evidence contracts/development/design.md#principled-representation A correction in the arm's coordinates added to the plan, the form of feed-forward plus error-driven feedback.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `AutoMovieMotionHumanArmCarry.carried` for an arm that follows a person.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan is the one model of the arm; the correction only maps the target's motion onto it.
 */
export namespace AutoMovieMotionHumanArmFollow {
  /**
   * The arm of a planned carry that follows its goal.
   *
   * The correction is zero up to `ready`. On the frame grid from there, each
   * frame takes one damped least-squares step (Wampler 1986) on the contact's
   * Jacobian at the corrected arm, toward the goal's motion since the plan
   * (`moved`) less the contact's motion the correction has already made, so
   * a goal that has not moved leaves the correction exactly zero and the arm
   * exactly the plan. The step is shortened to keep the elbow, the wrist and
   * the fingertip within the audit's travel bound (`SPEED_LIMIT`) beyond the
   * plan's own travel that frame, and halved while it would take the arm
   * deeper past the tangle audit's skin than it is. After `relax` the
   * correction returns to zero within the same bound, so the return rejoins
   * the plan. Between grid frames the correction is interpolated, so the arm
   * is a function of time: the grid is filled from `ready` once, in order,
   * and kept.
   *
   * @param body The body.
   * @param carry The arm.
   * @param span The span's instants.
   * @param plan The planned arm.
   * @param before The posture so far at any second.
   * @returns The arm at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the start, the step, its two bounds, the release after the hold and how a second between frames is read.
   * @evidence contracts/development/implementation.md#principled-implementation Error-driven feedback on a feed-forward plan by differential inverse kinematics (damped least squares), rate-limited by the audit's travel bound and kept by the planner's own clearance reading (`HumanArmTrajectoryModel.invalid`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One grid filled in order; per frame one error, one Jacobian, one step, its two bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero error gives a zero step, not a small one; the correction is never moved faster than the bound to catch up, and starts and ends at zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per grid frame of the hold: two goal reads, one frame, the Jacobian's forward placements (two per free coordinate) and a three-by-three solve, none when the goal has not moved.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanArmPlanned.moved`, `HumanArmGeometry`, `HumanArmTrajectoryContext` and `HumanArmTrajectoryModel.invalid`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function keeps the grid's corrections, one per frame of the hold and its release.
   */
  export function follower(
    body: IHumanBody,
    carry: AutoMovieMotionHumanArmPlanned.IPlanned,
    span: AutoMovieMotionHumanArmPlanned.ISpan,
    plan: HumanArmTrajectory.Trajectory,
    before: (seconds: number) => IHumanPosture,
  ): (seconds: number) => HumanArmClearance.IArm {
    const setup: HumanArmGeometry.ISetup = HumanArmGeometry.prepare(body, carry.side);
    const zero: number[] = new Array(HumanArmGeometry.DIMENSIONS).fill(0);
    const corrections: number[][] = [zero];
    let settled: boolean = false;
    const at = (j: number): number => span.ready + j * STEP;
    const add = (a: readonly number[], b: readonly number[], s: number = 1): number[] => a.map((v: number, i: number): number => v + s * b[i]!);
    const still = (c: readonly number[]): boolean => c.every((v: number): boolean => v === 0);

    // One more frame of the grid: the correction stepped toward its target.
    const next = (): void => {
      const j: number = corrections.length;
      const t: number = at(j);
      const previous: number[] = corrections[j - 1]!;
      const posture: IHumanPosture = before(t);
      const here: number[] = HumanArmGeometry.encode(setup, plan(t));
      const there: number[] = HumanArmGeometry.encode(setup, plan(at(j - 1)));
      const read: ReturnType<typeof AutoMovieMotionHumanArmPlanned.moved> | undefined =
        t < span.relax ? AutoMovieMotionHumanArmPlanned.moved(body, carry, posture, t) : undefined;
      if (read !== undefined && still(previous) && Vector3.length(read.error) === 0) {
        corrections.push(zero);
        return;
      }
      const context: HumanArmTrajectoryModel.IContext = HumanArmTrajectoryContext.of({
        body,
        times: [t],
        bases: [read?.base ?? AutoMovieMotionHumanArmPlanned.moved(body, carry, posture, span.relax).base],
        arms: [{ side: carry.side, rest: carry.rest, sites: [undefined] }],
      });
      const frame: HumanArmGeometry.IFrame = context.frames[0]![0]!;
      const placed = (q: readonly number[]): HumanArmGeometry.IPlaced => HumanArmGeometry.placed(setup, frame, q, false);
      const contact = (p: HumanArmGeometry.IPlaced, offset: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p.wrist, Quaternion.rotateVector(p.hand, offset));
      const travel = (a: readonly number[], b: readonly number[]): number => {
        const p: HumanArmGeometry.IPlaced = placed(a);
        const q: HumanArmGeometry.IPlaced = placed(b);
        let most: number = 0;
        for (const i of [HumanArmGeometry.ELBOW, HumanArmGeometry.WRIST, HumanArmGeometry.TIP])
          most = Math.max(most, Vector3.length(Vector3.subtract(p.probes[i]![0], q.probes[i]![0])));
        return most;
      };
      const current: number[] = add(here, previous);

      // The step: toward the goal's motion on the hold, back to the plan after it.
      let step: number[];
      if (read === undefined) step = previous.map((v: number): number => -v);
      else {
        const made: IAutoMovieVector3 = Vector3.subtract(contact(placed(current), read.contact), contact(placed(here), read.contact));
        step = damped(setup, current, (q: readonly number[]): IAutoMovieVector3 => contact(placed(q), read.contact), Vector3.subtract(read.error, made));
      }
      const room: number = Math.max(0, HumanArmTrajectoryModel.SPEED_LIMIT * STEP - travel(add(there, previous), current));
      const extra: number = travel(current, add(current, step));
      if (extra > room) step = step.map((v: number): number => (v * room) / extra);

      // Never deeper past the audit's skin than the arm already is.
      const depth = (q: readonly number[]): number => HumanArmTrajectoryModel.invalid(context, 0, [q]).value;
      const limit: number = Math.max(HumanArmTrajectoryModel.TOLERANCE, depth(current));
      for (let k: number = 0; k < HALVINGS && depth(add(current, step)) > limit; ++k) step = step.map((v: number): number => v / 2);
      if (depth(add(current, step)) > limit) step = zero;
      const corrected: number[] = add(previous, step);
      corrections.push(corrected);
      if (t >= span.relax && corrected.every((v: number): boolean => Math.abs(v) < 1e-9)) settled = true;
    };
    return (seconds: number): HumanArmClearance.IArm => {
      if (seconds <= span.ready) return plan(seconds);
      while (!settled && at(corrections.length - 1) < seconds && at(corrections.length) <= span.end) next();
      const last: number = corrections.length - 1;
      const correction: readonly number[] =
        seconds >= at(last)
          ? settled
            ? zero
            : corrections[last]!
          : ((): number[] => {
              const j: number = Math.min(last - 1, Math.floor((seconds - span.ready) / STEP));
              const u: number = (seconds - at(j)) / STEP;
              return corrections[j]!.map((v: number, i: number): number => v + (corrections[j + 1]![i]! - v) * u);
            })();
      return still(correction) ? plan(seconds) : HumanArmGeometry.arm(setup, add(HumanArmGeometry.encode(setup, plan(seconds)), correction));
    };
  }
}

/**
 * One damped least-squares step of the arm's free coordinates toward a
 * displacement of a point it carries: `Jᵀ(JJᵀ + λ²I)⁻¹ r`, the Jacobian by
 * central differences, `λ²` a millionth of the Jacobian's own scale so a
 * singular arm takes a bounded step.
 */
function damped(
  setup: HumanArmGeometry.ISetup,
  q: readonly number[],
  point: (q: readonly number[]) => IAutoMovieVector3,
  r: IAutoMovieVector3,
): number[] {
  const out: number[] = new Array(HumanArmGeometry.DIMENSIONS).fill(0);
  if (Vector3.length(r) === 0) return out;
  const free: number[] = [];
  const columns: IAutoMovieVector3[] = [];
  for (let d: number = 0; d < HumanArmGeometry.DIMENSIONS; ++d) {
    if (!setup.free[d]!) continue;
    const up: number[] = [...q];
    const down: number[] = [...q];
    up[d] = up[d]! + H;
    down[d] = down[d]! - H;
    free.push(d);
    columns.push(Vector3.scale(Vector3.subtract(point(up), point(down)), 1 / (2 * H)));
  }
  // JJᵀ, three by three, damped.
  const axis = (v: IAutoMovieVector3, i: number): number => (i === 0 ? v.x : i === 1 ? v.y : v.z);
  const m: number[][] = [0, 1, 2].map((i: number): number[] =>
    [0, 1, 2].map((k: number): number => columns.reduce((s: number, c: IAutoMovieVector3): number => s + axis(c, i) * axis(c, k), 0)),
  );
  const damping: number = (1e-6 * (m[0]![0]! + m[1]![1]! + m[2]![2]!)) / 3;
  for (let i: number = 0; i < 3; ++i) m[i]![i]! += damping;
  const y: number[] = solve3(m, [r.x, r.y, r.z]);
  free.forEach((d: number, f: number): void => {
    const c: IAutoMovieVector3 = columns[f]!;
    out[d] = c.x * y[0]! + c.y * y[1]! + c.z * y[2]!;
  });
  return out;
}

/** A three-by-three symmetric definite system solved by Cramer's rule. */
function solve3(m: readonly (readonly number[])[], b: readonly number[]): number[] {
  const det = (a: readonly (readonly number[])[]): number =>
    a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
    a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
    a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
  const whole: number = det(m);
  return [0, 1, 2].map((k: number): number => det(m.map((row: readonly number[], i: number): number[] => row.map((v: number, c: number): number => (c === k ? b[i]! : v)))) / whole);
}

/** The correction's grid, seconds: the frame grid the planner's hold is sampled on. */
const STEP: number = 1 / 30;

/** Halvings of a step that would take the arm deeper past the skin, before it is not taken. */
const HALVINGS: number = 4;

/** The coordinate step of the Jacobian's central differences, coordinate units. */
const H: number = 0.05;
