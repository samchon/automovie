import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanHandover } from "./HumanHandover";

/**
 * The original upright-carry yaw choice and current raw request assembly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the original full-posture callback chooser, current handover frame assembly, actual degree tilt metric and scalar time-course lookup, without certifying borrowed posture graphs immutable.
 * @evidence contracts/development/design.md#principled-representation World-metre posture/goals and world quaternion attitudes retain canonical types; the existing degree yaw grid and second-based sample/interpolation policy remain HumanHandover's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ordinary serves the public callback and both actual giver/receiver yaw courses; posed assembles each current raw request, and angle owns their shared original tip metric.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback or borrowed posture is inferred yaw-invariant or plain. Each original yaw still invokes its full callback/fit, with no fixed base, skipped source observation, changed sample/tolerance or stored pose.
 */
export namespace HumanHandoverUpright {
  /**
   * One current raw body, complete other goals and actual hand task.
   *
   * @evidence contracts/development/common.md#meaningful-documentation posture carries the current raw root/joints/digits/other limbs; goal retains actual world-metre fields and rotation evaluates the requested degree yaw for this one request.
   * @evidence contracts/development/design.md#principled-representation Removing rotation from the goal prevents duplicate attitude owners; each actual raw frame supplies canonical posture/task values while rotation remains a typed quaternion query.
   * @evidence contracts/development/design.md#minimal-and-owned-surface handOver and receive produce all three members anew for each original yaw callback; posed emits the same complete request for actual fitting and display.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Frames contain no solved pose, source-immutability certificate or successful-contact assertion; ordinary selection constructs and fits one actual frame for every original yaw callback.
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
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion work per actual yaw; ordinary selection separately retains each original transport/digit/body callback and full fit.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each actual callback owns one current frame request; its attitude is evaluated without retaining or reusing a result across yaw candidates.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All actual giver/receiver and public callback courses share the same candidate order, cost/tie policy and scalar interpolation, without sharing fitted answers or source frames.
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
    return { ...frame.posture,
      limbs: { ...frame.posture.limbs, [`${side}Arm`]: goalOf(frame, yaw) } };
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

/** Preserve the acting goal's original field order for both ranking and display. */
function goalOf(frame: HumanHandoverUpright.IFrame, yaw: number): IHumanPosture.IGoal {
  const { point, ...rest }: typeof frame.goal = frame.goal;
  return { point, rotation: frame.rotation(yaw), ...rest };
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
