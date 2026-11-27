import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmDifferential } from "../posture/HumanArmDifferential";
import { HumanArmGeometry } from "../posture/HumanArmGeometry";
import { HumanArmTrajectoryContext } from "../posture/HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionInterval } from "./AutoMovieMotionInterval";

/**
 * A planned arm that follows a person who moves: the feed-forward plan
 * (`AutoMovieMotionHumanArmPlanned.planned`, the person as perceived when it
 * was made) plus a feedback correction driven only by how far the goal has
 * moved since the plan perceived it (`AutoMovieMotionHumanArmPlanned.moved`),
 * mapped onto the arm by differential inverse kinematics and moved no faster
 * than the plan's own pace leaves it room for.
 */
export namespace AutoMovieMotionHumanArmFollow {
  /**
   * The arm of a planned carry that follows its goal.
   *
   * The correction is zero at `start`; on the reach the goal's motion counts by
   * the share of the reach made. On the frame grid from there, each frame takes
   * one damped least-squares step (`HumanArmDifferential.step`) on the
   * contact's Jacobian at the corrected arm, toward the goal's motion since the
   * plan (`moved`) less the contact's motion the correction has already made,
   * so a goal that has not moved leaves the correction exactly zero and the arm
   * exactly the plan. The step is shortened to keep the elbow, the wrist and
   * the fingertip within the plan's own pace (its fastest probe's travel over a
   * frame of the span, the law's own timed arm) beyond the plan's own travel
   * that frame, and halved while it would take the arm deeper past the tangle
   * audit's skin than it is. After `relax` the correction returns to zero
   * within the same bound, so the return rejoins the plan. Between grid frames
   * the correction is interpolated, so the arm is a function of time: the grid
   * is filled from `start` once, in order, when the follower is made, which
   * its arm makes once the performance is placed
   * (`IAutoMovieMotionHumanPrimitive.ready`).
   *
   * @param body The body.
   * @param carry The arm.
   * @param span The span's instants.
   * @param plan The planned arm.
   * @param before The posture so far at any second.
   * @returns The arm at a second.
   */
  export function follower(
    body: IAutoMovieMotionHumanBody,
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    plan: IAutoMovieMotionHumanArmTrajectory.Trajectory,
    before: IAutoMovieMotionHumanActionPlan["posture"],
  ): (seconds: number) => IAutoMovieMotionHumanArmClearance.IArm {
    const setup: IAutoMovieMotionHumanArmGeometry.ISetup =
      HumanArmGeometry.prepare(body, carry.side);
    const contextOf: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      HumanArmTrajectoryContext.prepare(body, [carry.side]);
    const zero: number[] = new Array(HumanArmGeometry.DIMENSIONS).fill(0);
    const corrections: number[][] = [zero];
    let settled: boolean = false;
    // The plan's own fastest probe travel over a frame, metres, read once;
    // the goal's fastest travel over a frame so far, and its last motion.
    let pace: number | undefined;
    let tracked: number = 0;
    // The correction runs from the reach's start: a shot corrects toward the
    // moving person all the way in, as visually guided reaching does
    // (Brenner and Smeets 1997), not only once the hand is on the hold.
    const at = (j: number): number => span.start + j * STEP;
    // On the reach the goal's motion counts by the share of the reach made,
    // the carry's own weight, so the correction starts from zero with the
    // reach and is the whole motion by the hold.
    const share = (t: number): number =>
      t >= span.ready
        ? 1
        : AutoMovieMotionInterval.progress(span.start, span.ready, t);
    const add = (
      a: readonly number[],
      b: readonly number[],
      s: number = 1,
    ): number[] => a.map((v: number, i: number): number => v + s * b[i]!);
    const still = (c: readonly number[]): boolean =>
      c.every((v: number): boolean => v === 0);

    // One more frame of the grid: the correction stepped toward its target.
    const next = (
      source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): void => {
      const j: number = corrections.length;
      const t: number = at(j);
      const previous: number[] = corrections[j - 1]!;

      // A correction still at zero stays there wherever the step is zero by
      // construction, so the frame is settled without reading anything.
      // On the hold of a carry with no perceived goal the two goals `moved`
      // compares are one callback read twice with the same arguments on the
      // same pose, so their sites' difference is exactly zero. After the hold
      // the step is the correction's own negation, zero, which the travel
      // bound cannot scale and the depth test cannot refuse.
      if (
        still(previous) &&
        (t >= span.relax || carry.perceived === undefined)
      ) {
        corrections.push(zero);
        if (t >= span.relax) settled = true;
        return;
      }
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      const posture: IAutoMovieMotionHumanPosture = before(
        t,
        undefined,
        resolution,
        project,
      );
      const here: number[] = HumanArmGeometry.encode(setup, plan(t));
      const there: number[] = HumanArmGeometry.encode(setup, plan(at(j - 1)));
      const read:
        | ReturnType<typeof AutoMovieMotionHumanArmPlanned.moved>
        | undefined =
        t < span.relax
          ? AutoMovieMotionHumanArmPlanned.moved(
              body,
              carry,
              posture,
              t,
              resolution,
              project,
            )
          : undefined;
      if (
        read !== undefined &&
        still(previous) &&
        Vector3.length(read.error) === 0
      ) {
        corrections.push(zero);
        return;
      }
      const context: HumanArmTrajectoryModel.IContext = contextOf({
        body,
        times: [t],
        bases: [
          read?.base ??
            AutoMovieMotionHumanArmPlanned.moved(
              body,
              carry,
              posture,
              span.relax,
              resolution,
              project,
            ).base,
        ],
        arms: [{ side: carry.side, rest: carry.rest, sites: [undefined] }],
      });
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame =
        context.frames[0]![0]!;
      const placed = (
        q: readonly number[],
      ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        HumanArmGeometry.placed(setup, frame, q, false);
      const contact = (
        p: IAutoMovieMotionHumanArmGeometry.IPlaced,
        offset: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Vector3.add(p.wrist, Quaternion.rotateVector(p.hand, offset));
      const travel = (a: readonly number[], b: readonly number[]): number => {
        const p: IAutoMovieMotionHumanArmGeometry.IPlaced = placed(a);
        const q: IAutoMovieMotionHumanArmGeometry.IPlaced = placed(b);
        let most: number = 0;
        for (const i of [
          HumanArmGeometry.ELBOW,
          HumanArmGeometry.WRIST,
          HumanArmGeometry.TIP,
        ])
          most = Math.max(
            most,
            Vector3.length(Vector3.subtract(p.probes[i]![0], q.probes[i]![0])),
          );
        return most;
      };
      const current: number[] = add(here, previous);

      // The step: toward the goal's motion on the hold, back to the plan after it.
      let step: number[];
      if (read === undefined) step = previous.map((v: number): number => -v);
      else {
        const made: IAutoMovieVector3 = Vector3.subtract(
          contact(placed(current), read.contact),
          contact(placed(here), read.contact),
        );
        step = HumanArmDifferential.step(
          setup,
          frame,
          current,
          read.contact,
          Vector3.subtract(Vector3.scale(read.error, share(t)), made),
        );
        tracked = Math.max(
          tracked,
          Vector3.length(
            Vector3.subtract(Vector3.scale(read.error, share(t)), made),
          ),
        );
      }
      // The plan's own pace: its fastest probe's travel over a frame of the
      // span, read once, on the base of the first frame that steps; the
      // correction keeps within it.
      if (pace === undefined)
        pace = ((): number => {
        let most: number = 0;
        let last: number[] = HumanArmGeometry.encode(setup, plan(span.start));
        for (
          let s: number = span.start + STEP;
          s < span.end + STEP / 2;
          s += STEP
        ) {
          const now: number[] = HumanArmGeometry.encode(
            setup,
            plan(Math.min(s, span.end)),
          );
          most = Math.max(most, travel(last, now));
          last = now;
        }
        return most;
      })();
      // The correction moves no faster than it takes to close what the goal
      // has moved since the correction last met it, a frame of the person's
      // own motion: it tracks the person at the person's speed, as a hand's
      // online correction toward a moving target does (Brenner and Smeets
      // 1997, J Mot Behav 29:297), and releases at the fastest it tracked
      // after the hold; beyond that, at the plan's own pace.
      const room: number = Math.max(
        0,
        Math.max(pace, tracked) - travel(add(there, previous), current),
      );
      const extra: number = travel(current, add(current, step));
      if (extra > room)
        step = step.map((v: number): number => (v * room) / extra);

      // Never deeper past the audit's skin than the arm already is.
      const depth = (q: readonly number[]): number =>
        HumanArmTrajectoryModel.invalid(context, 0, [q]).value;
      const limit: number = Math.max(
        HumanArmTrajectoryModel.TOLERANCE,
        depth(current),
      );
      // Halvings below the model's tolerance (the depth it is compared at)
      // change no reading: a step moves a probe at most the pace a frame.
      const halvings: number = Math.max(
        0,
        Math.ceil(
          Math.log2(
            (Math.max(pace, tracked) * 1000) /
              HumanArmTrajectoryModel.TOLERANCE,
          ),
        ),
      );
      // Each trial step's depth is read once: the reading that ends the
      // halvings is the one the final test reads.
      let reached: number = depth(add(current, step));
      for (let k: number = 0; k < halvings && reached > limit; ++k) {
        step = step.map((v: number): number => v / 2);
        reached = depth(add(current, step));
      }
      if (reached > limit) step = zero;
      const corrected: number[] = add(previous, step);
      corrections.push(corrected);
      if (
        t >= span.relax &&
        corrected.every((v: number): boolean => Math.abs(v) < 1e-9)
      )
        settled = true;
    };
    // The whole grid is filled here, in order from `start`, so the arm read
    // after is a closed-form evaluation of it.
    while (!settled && at(corrections.length) <= span.end) next();
    return (seconds: number): IAutoMovieMotionHumanArmClearance.IArm => {
      if (seconds <= span.start) return plan(seconds);
      const last: number = corrections.length - 1;
      const correction: readonly number[] =
        seconds >= at(last)
          ? settled
            ? zero
            : corrections[last]!
          : ((): number[] => {
              const j: number = Math.min(
                last - 1,
                Math.floor((seconds - span.start) / STEP),
              );
              const u: number = (seconds - at(j)) / STEP;
              return corrections[j]!.map(
                (v: number, i: number): number =>
                  v + (corrections[j + 1]![i]! - v) * u,
              );
            })();
      return still(correction)
        ? plan(seconds)
        : HumanArmGeometry.arm(
            setup,
            add(HumanArmGeometry.encode(setup, plan(seconds)), correction),
          );
    };
  }
}

/**
 * The correction's grid, seconds: the frame grid the planner's hold is sampled
 * on (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;
