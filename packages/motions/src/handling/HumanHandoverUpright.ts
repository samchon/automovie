import { Quaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieQuaternion } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanHandover } from "./HumanHandover";

/**
 * The original upright-carry yaw choice, with explicit fixed-time preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates ordinary full-posture callbacks from handover frames whose direct body/digits and goal geometry are fixed at one sampled second while only hand yaw varies.
 * @evidence contracts/development/design.md#principled-representation World-metre posture/goals and world quaternion attitudes retain canonical types; the existing degree yaw grid and second-based sample/interpolation policy remain HumanHandover's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ordinary serves the existing public callback facade; prepared and posed serve the actual giver/receiver fixed-time frame producers; angle owns the shared original tip metric.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback is assumed yaw-invariant: the prepared path requires explicit separate fixed geometry and yaw attitude. No pose result, altered sample, tolerance or solver is represented.
 */
export namespace HumanHandoverUpright {
  /**
   * One actual second's fixed direct body, complete other goals and hand task.
   *
   * @evidence contracts/development/common.md#meaningful-documentation posture contains the unchanged root/direct joints/digits/other limbs; goal has fixed world-metre task fields and rotation evaluates only the actual degree yaw freedom.
   * @evidence contracts/development/design.md#principled-representation Removing rotation from the goal prevents duplicate attitude owners; one fixed-time frame supplies canonical posture/task values while its rotation remains a typed quaternion query.
   * @evidence contracts/development/design.md#minimal-and-owned-surface handOver and receive produce all three members; prepared fits each actual yaw and posed emits the same request for display.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Frames cannot contain a solved pose or successful-contact assertion; fixed body/rig/source geometry must remain unchanged through the synchronous sample search.
   */
  export interface IFrame {
    /** The fixed current body/digits and complete other limb goals. */
    posture: IHumanPosture;
    /** The acting hand's original task except its varying attitude. */
    goal: Omit<IHumanPosture.IGoal, "rotation">;
    /**
     * The original hand attitude at a candidate's degree yaw.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Input is a degree turn about world up; output is the original world hand rotation for this fixed second.
     * @evidence contracts/development/implementation.md#principled-implementation The actual producer retains its original world-up quaternion product during the upright carry and its unchanged attitude outside that window.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One attitude-only callback exposes the actual varying goal while body/path/digits stay with the frame.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle, quaternion normalization, active window or multiplication grouping changes.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion work per actual yaw without repeating transport, digit schedule or body leaning.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed second geometry is shared explicitly; each requested yaw evaluates its original attitude without storing a result.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous frame retains its fixed attitude/window data until its sample is released; returned quaternions retain the original ownership, with no time history or handle.
     */
    rotation: (yaw: number) => IAutoMovieQuaternion;
  }

  /**
   * Keep the original arbitrary-posture callback behavior.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Body/side and full callback are evaluated at the existing from/to seconds and endpoint degree turns; output is the original scalar yaw course.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates every actual callback posture to HumanHandover.tipped, preserving full constrained solves before the common yaw chooser.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One score adapter retains one chooser and the existing complete posture owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No invariant is inferred about arbitrary callbacks and no callback, sample, fit or candidate is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preserves nine full solves per selected sample; only scalar course lookup uses the original equivalent binary interval search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ordinary and prepared paths share exact candidate order, cost/tie policy and scalar interpolation, without sharing fitted answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Callback/body/fit work is local to planning; the detached returned interpolator retains only K scalar times and turns until its action is released.
   */
  export function ordinary(body: IHumanBody, side: HumanHand.Side,
    at: (seconds: number, yaw: number) => IHumanPosture,
    from: number, to: number, ends: readonly [number, number | undefined],
  ): (seconds: number) => number {
    return chosen((seconds: number): ((yaw: number) => number) =>
      (yaw: number): number => HumanHandover.tipped(body, side, at(seconds, yaw)), from, to, ends);
  }

  /**
   * Fit every original yaw from one explicitly fixed actual frame per sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The frame producer fixes complete direct body/digit/task geometry at each requested second; actual yaw attitudes and original endpoint/sample policy determine the scalar output course.
   * @evidence contracts/development/implementation.md#principled-implementation One prepareBase snapshots that actual frame's direct root/joints/digits; every original yaw replaces complete actual limbs and runs the unchanged coupled/clearance/ROM/digit solves before the same tip metric.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded frame/base/FK reader per sample feeds the common request assembler and chooser, with no second fit or yaw policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every nine-yaw candidate, original STEP schedule, carried previous turn cost, strict 1e-9 tie and original fully supplied endpoint behavior; no result is reused as a fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each K-sample fixed body/path/digit preparation replaces nine repeated preparations; all nine actual complete candidate fits remain and readback requests only the holding hand ancestry. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual handOver/receive producers separate fixed-second geometry from the hand's sole yaw freedom; unchanged body/rig and explicit fixed frame justify base/FK work sharing, while every goal/fit remains actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each sample owns one O(B) fixed base and exact FK reader only while ranking its nine yaws; the detached output retains K scalar times/turns without frames, body, readers, fits, history or handles.
   */
  export function prepared(body: IHumanBody, side: HumanHand.Side,
    at: (seconds: number) => IFrame,
    from: number, to: number, ends: readonly [number, number | undefined],
  ): (seconds: number) => number {
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    return chosen((seconds: number): ((yaw: number) => number) => {
      const frame: IFrame = at(seconds);
      const base: ReturnType<typeof resolveHumanPosture.prepareBase> = resolveHumanPosture.prepareBase(body, frame.posture);
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
      return (yaw: number): number => {
        const current: ReturnType<typeof request> = request(frame, side, yaw);
        return angle(current.goal.rotation, poseBones(body,
          base.seeded(current.limbs, undefined, resolution).pose, resolution(), requested,
        ).get(`${side}Hand`)?.worldRotation);
      };
    }, from, to, ends);
  }

  /**
   * Emit the original complete raw posture for one actual yaw and frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Consumes fixed-time body/task frame, acting side and degree yaw; output retains all other limbs/digits and the actual hand attitude.
   * @evidence contracts/development/implementation.md#principled-implementation Replaces only the acting arm with the frame's original complete task and evaluated rotation, retaining every other authored field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared request assembler serves both candidate fitting and displayed raw posture construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal field, reference, planting, task point, rotation product or other channel is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant goal/map assembly without a solve; the performance retains its normal complete solver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same actual frame/goal assembler supplies rank and display, avoiding a separate pose equation or prepared fit result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh posture/limb/goal wrappers borrowing original immutable frame geometry; no builder, FK reader, queried time or history is retained.
   */
  export function posed(frame: IFrame, side: HumanHand.Side, yaw: number): IHumanPosture {
    return { ...frame.posture, limbs: request(frame, side, yaw).limbs };
  }

  /**
   * The original upright tip metric of asked and actually reached attitudes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are world hand quaternions; absent either returns Infinity, otherwise output is the original degree tilt of world up.
   * @evidence contracts/development/implementation.md#principled-implementation Applies normalized reached times inverse normalized asked to world up, clips its Y to [-1,1] and reads acos in degrees.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative rotation and one clipped angle serve ordinary and prepared actual fits.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original missing-attitude Infinity, quaternion operation order and scalar clipping without new tolerance or normalization policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion/vector/scalar arithmetic without traversal or allocation proportional to a scene.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both paths use this exact scalar owner; no pose/rotation/angle answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no inputs, result history, collection or handle.
   */
  export function angle(asked: IAutoMovieQuaternion | undefined, reached: IAutoMovieQuaternion | undefined): number {
    if (asked === undefined || reached === undefined) return Infinity;
    const off: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.normalize(reached), Quaternion.inverse(Quaternion.normalize(asked)));
    return (Math.acos(Math.max(-1, Math.min(1, Quaternion.rotateVector(off, { x: 0, y: 1, z: 0 }).y))) * 180) / Math.PI;
  }
}

/** Keep rank and display on the same complete acting-arm goal. */
function request(frame: HumanHandoverUpright.IFrame, side: HumanHand.Side, yaw: number): {
  goal: IHumanPosture.IGoal;
  limbs: IHumanPosture["limbs"];
} {
  const { point, ...rest }: typeof frame.goal = frame.goal;
  const goal: IHumanPosture.IGoal = { point, rotation: frame.rotation(yaw), ...rest };
  return { goal, limbs: { ...frame.posture.limbs, [`${side}Arm`]: goal } };
}

/** Original ordered yaw selection and carried previous-turn preference. */
function chosen(rankAt: (seconds: number) => (yaw: number) => number,
  from: number, to: number, ends: readonly [number, number | undefined],
): (seconds: number) => number {
  const count: number = Math.max(1, Math.ceil((to - from) / HumanHandover.STEP - 1e-9));
  const times: number[] = [from];
  const turns: number[] = [ends[0]];
  for (let k: number = 1; k <= count; k++) {
    const seconds: number = from + ((to - from) * k) / count;
    times.push(seconds);
    if (k === count && ends[1] !== undefined) { turns.push(ends[1]); continue; }
    const rank: (yaw: number) => number = rankAt(seconds);
    const before: number = turns.at(-1)!;
    let best: number = before;
    let least: number = Infinity;
    for (const yaw of HumanHandover.YAWS) {
      const cost: number = rank(yaw) + 0.1 * Math.abs(yaw - before);
      if (cost < least - 1e-9) { least = cost; best = yaw; }
    }
    turns.push(best);
  }
  return interpolate(from, times, turns);
}

/** Retain only the scalar course after all frame and numerical work is released. */
function interpolate(from: number, times: readonly number[], turns: readonly number[]): (seconds: number) => number {
  return (seconds: number): number => {
    if (!(seconds > from)) return turns[0]!;
    let low: number = 1;
    let high: number = times.length;
    while (low < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (seconds <= times[middle]!) high = middle;
      else low = middle + 1;
    }
    if (low === times.length) return turns.at(-1)!;
    return turns[low - 1]! + ((turns[low]! - turns[low - 1]!) * (seconds - times[low - 1]!)) / (times[low]! - times[low - 1]!);
  };
}
