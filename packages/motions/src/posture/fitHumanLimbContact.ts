import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieChainBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";

/**
 * Fit the ankle/wrist and preserve its actual authored offset contact through
 * the existing Anderson-mixed re-aim and actual best-contact selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current world goal/contact, side, actual prepared workspace and point-fitting policy; no-contact goals return their one ordinary fit.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original fixed-point contact relation and one-step Anderson mixing, retaining the nearest actual fitted contact and its actual toe correction when iteration does not close.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner holds contact re-aiming once, while HumanLimbFit owns attachment/obstacle/source construction and selects ordinary versus explicit continuous-curve point fitting.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the 20-micrometre admission, original 16 mixed orientation passes and original accepted branch. An offset wrist failing actual FK admission can take up to fifteen improving projected-position corrections at the same bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fit without an offset contact. Both re-aim phases are bounded by REAIM_PASSES, continue the previous seed and stop on admission. The wrist-only projected correction also stops on its first non-improving fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same goal-specific workspace across actual re-aimed targets; a later pass continues the previous pass's swivel seed for a target millimetres away (a seed from this same synchronous fit, never another instant's); each fit and rotation remains current and the actual chosen toes travel with that candidate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Goal, workspace, fit policy and bounded current/best candidate state are synchronous local data. Returned records retain no reader, callback, source factory, history or handle.
 */
export function fitHumanLimbContact(fitter: ReturnType<typeof prepareHumanLimbFit>, goal: IAutoMovieHumanLimbGoal,
  side: AutoMovieHumanSide, leg: boolean,
  fit: (point: IAutoMovieVector3, continued?: IAutoMovieSwivelNear, capture?: fitHumanLimbContact.ICapture) => IAutoMovieSeededChainFit,
  rocker?: IAutoMovieVector3): IAutoMovieSeededChainFit {
  if (goal.contact === undefined || goal.rotation === undefined) return fit(goal.point);
  let frame: IContactPrefix | undefined;
  let chosen: IContactPrefix | undefined;
  const capture: fitHumanLimbContact.ICapture = (rotation, position): void => {
    frame = { rotation, position };
  };
  let fitted: IAutoMovieSeededChainFit = fit(goal.point, undefined, capture);
  const anchor: IAutoMovieVector3 = Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, goal.contact));
  let point: IAutoMovieVector3 = goal.point;
  let last: IReaimIteration | undefined;
  let nearestRotation: IAutoMovieQuaternion | undefined;
  let nearest: IAutoMovieSeededChainFit = fitted;
  let nearestMiss: number = Infinity;
  let nearestPoint: IAutoMovieVector3 = point;

  // A current orientation changes the offset point; keep its best actual contact if mixing does not close.
  for (let i: number = 0; i < REAIM_PASSES; ++i) {
    const reached: IAutoMovieQuaternion = frame?.rotation ?? fitter.rotation(fitted.pose);
    const aim: IAutoMovieVector3 = Vector3.subtract(anchor, Quaternion.rotateVector(reached, goal.contact));
    const miss: IAutoMovieVector3 = Vector3.subtract(aim, point);
    const missSize: number = Vector3.length(miss);
    if (missSize < nearestMiss) {
      nearest = fitted;
      nearestPoint = point;
      chosen = frame;
      nearestMiss = missSize;
      if (leg) nearestRotation = reached;
    }
    if (missSize < REAIM_TOLERANCE || i === REAIM_PASSES - 1) break;
    let next: IAutoMovieVector3 = aim;
    if (last !== undefined) {
      const change: IAutoMovieVector3 = Vector3.subtract(miss, last.miss);
      const size: number = Vector3.dot(change, change);
      if (size > 1e-18) {
        const mixing: number = Math.max(-20, Math.min(20, Vector3.dot(change, miss) / size));
        next = Vector3.subtract(aim, Vector3.scale(Vector3.subtract(aim, last.image), mixing));
      }
    }
    last = { image: aim, miss };
    point = next;

    // A re-aimed target lies millimetres from the last one, so its fit
    // continues the last pass's seed, refined to the cold sweep's own
    // resolution, instead of searching every swivel again.
    frame = undefined;
    fitted = fit(point, fitted.seed === null ? undefined
      : { ...fitted.seed, tolerance: hingedArmSwivel.RESOLUTION }, capture);
  }
  if (!leg) {
    // A projected wrist can miss the requested centre even when its orientation
    // has converged. Close the residual in the actual socket frame.
    fitted = nearest;
    point = nearestPoint;
    frame = chosen;
    nearestMiss = Infinity;
    for (let i: number = 0; i < REAIM_PASSES; ++i) {
      const achieved: IAutoMovieChainBone = frame === undefined ? fitter.effector(fitted.pose) : {
        worldPosition: frame.position(),
        worldRotation: frame.rotation,
      };
      const contact: IAutoMovieVector3 = Vector3.add(
        achieved.worldPosition,
        Quaternion.rotateVector(achieved.worldRotation, goal.contact),
      );
      const residual: IAutoMovieVector3 = Vector3.subtract(anchor, contact);
      const error: number = Vector3.length(residual);
      if (error >= nearestMiss) break;
      nearest = fitted;
      nearestMiss = error;
      if (error < REAIM_TOLERANCE || i === REAIM_PASSES - 1) break;
      point = Vector3.add(point, residual);
      frame = undefined;
      fitted = fit(point, fitted.seed === null ? undefined
        : { ...fitted.seed, tolerance: hingedArmSwivel.RESOLUTION }, capture);
    }
    return nearest;
  }
  fitted = nearest;
  if (nearestRotation === undefined) return fitted;
  const toes: number = Math.max(0, HumanFoot.pitch(goal.rotation) - HumanFoot.pitch(nearestRotation));
  if (toes === 0) return fitted;

  // Past the ankle's dorsiflexion the forefoot rocks about the toes' joint
  // (`mtp`), the joint the toes then take their pitch back about: re-aimed
  // about that joint, the toes lie still on the floor as the heel rises.
  // Re-aimed about the ball's floor point below it, the toe tip slid by the
  // joint's height times the sine of the pitch.
  if (rocker !== undefined)
    return fitHumanLimbContact(fitter, { ...goal, contact: rocker }, side, leg, fit);
  const bone: AutoMovieHumanoidBone = `${side}Toes`;
  return {
    pose: { ...fitted.pose, joints: fitted.pose.joints.map((joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      joint.bone === bone ? { ...joint, flexion: (joint.flexion ?? 0) + toes } : joint) },
    seed: fitted.seed,
    ...(fitted.value === undefined ? {} : { value: fitted.value }),
  };
}

/** The preceding target image and its fixed-point residual for Anderson mixing. */
interface IReaimIteration {
  image: IAutoMovieVector3;
  miss: IAutoMovieVector3;
}

/** Original provisional 20-micrometre re-aim resolution, finer than every contact verdict. */
const REAIM_TOLERANCE: number = 2e-5;

/** Maximum fits per correction phase. Prior measured near-limit heel-off needs up to eleven orientation fits. */
const REAIM_PASSES: number = 16;

/** Geometry supplied by the fit that made this candidate. */
interface IContactPrefix {
  position: () => IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
}

/**
 * The reading offered by a native ordinary fit during this operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the optional same-fit reading used for a contact observation.
 * @evidence contracts/development/design.md#principled-representation The callback is the engine fitter's own type, in the same frame as the goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The target-specific ordinary method alone forwards the reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing observations follow the existing full fit frame path.
 */
export namespace fitHumanLimbContact {
  /** The solver may supply the final prefix for the exact requested fit. */
  export type ICapture = NonNullable<Parameters<ReturnType<typeof prepareHumanLimbFit>["fit"]>[3]>;
}
