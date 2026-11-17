import { type IAutoMovieSeededChainFit, Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanLimbFit } from "./prepareHumanLimbFit";

/**
 * Fit the ankle/wrist and preserve its actual authored offset contact through
 * the existing Anderson-mixed re-aim and actual best-contact selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current world goal/contact, side, actual prepared workspace and point-fitting policy; no-contact goals return their one ordinary fit.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original fixed-point contact relation and one-step Anderson mixing, retaining the nearest actual fitted contact and its actual toe correction when iteration does not close.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner holds contact re-aiming once, while HumanLimbFit owns attachment/obstacle/source construction and selects ordinary versus explicit continuous-curve point fitting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original20-micrometre contact resolution,16-pass budget, mixing bound, original arithmetic and best-candidate policy remain unchanged; no sampled contact or altered goal replaces a fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fit without an offset contact; otherwise at most16 actual contact fits and bounded vector work, with no additional solve or callback-result cache.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same goal-specific workspace across actual re-aimed targets; each fit and rotation remains current and the actual chosen toes travel with that candidate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Goal, workspace, fit policy and bounded current/best candidate state are synchronous local data. Returned records retain no reader, callback, source factory, history or handle.
 */
export function fitHumanLimbContact(fitter: ReturnType<typeof prepareHumanLimbFit>, goal: IHumanPosture.IGoal,
  side: "left" | "right", leg: boolean, fit: (point: IAutoMovieVector3) => IAutoMovieSeededChainFit): IAutoMovieSeededChainFit {
  let fitted: IAutoMovieSeededChainFit = fit(goal.point);
  if (goal.contact === undefined || goal.rotation === undefined) return fitted;
  const anchor: IAutoMovieVector3 = Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, goal.contact));
  let point: IAutoMovieVector3 = goal.point;
  let last: { image: IAutoMovieVector3; miss: IAutoMovieVector3 } | undefined;
  let toes: number = 0;
  let nearest: { fitted: IAutoMovieSeededChainFit; miss: number; toes: number } = { fitted, miss: Infinity, toes: 0 };

  // A current orientation changes the offset point; keep its best actual contact if mixing does not close.
  for (let i: number = 0; i < REAIM_PASSES; ++i) {
    const reached: IAutoMovieQuaternion = fitter.rotation(fitted.pose);
    const off: ReturnType<typeof HumanFoot.heelOff> = HumanFoot.heelOff(goal.rotation, reached, anchor, goal.contact);
    toes = off.toes;
    const miss: IAutoMovieVector3 = Vector3.subtract(off.ankle, point);
    const missSize: number = Vector3.length(miss);
    if (missSize < nearest.miss) nearest = { fitted, miss: missSize, toes };
    if (missSize < REAIM_TOLERANCE || i === REAIM_PASSES - 1) break;
    let next: IAutoMovieVector3 = off.ankle;
    if (last !== undefined) {
      const change: IAutoMovieVector3 = Vector3.subtract(miss, last.miss);
      const size: number = Vector3.dot(change, change);
      if (size > 1e-18) {
        const mixing: number = Math.max(-20, Math.min(20, Vector3.dot(change, miss) / size));
        next = Vector3.subtract(off.ankle, Vector3.scale(Vector3.subtract(off.ankle, last.image), mixing));
      }
    }
    last = { image: off.ankle, miss };
    point = next;
    fitted = fit(point);
  }
  fitted = nearest.fitted;
  toes = nearest.toes;
  if (!leg || toes === 0) return fitted;
  const bone: AutoMovieHumanoidBone = `${side}Toes`;
  return {
    pose: { ...fitted.pose, joints: fitted.pose.joints.map((joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      joint.bone === bone ? { ...joint, flexion: (joint.flexion ?? 0) + toes } : joint) },
    seed: fitted.seed,
    ...(fitted.value === undefined ? {} : { value: fitted.value }),
  };
}

/** Original provisional20-micrometre re-aim resolution, finer than every contact verdict. */
const REAIM_TOLERANCE: number = 2e-5;

/** Original provisional16-fit ceiling; prior measured heel-off near-limit cases need up to11. */
const REAIM_PASSES: number = 16;
