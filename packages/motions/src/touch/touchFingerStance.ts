import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";


/** The hand frame and the base admitted for that frame. */
type Chosen<T> = readonly [IAutoMovieMotionHumanTouchEffector.IEffector, T];

/**
 * Fit the requested hand and grounded stance. A bare fingertip may roll from
 * its distal face towards its palmar pad while retaining its actual tip site.
 * Prefer the authored contact frame, then refine an admitted rotation in
 * the bracket between it and the flat pad. Each admitted frame uses the same
 * support and reach tests as the original.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The two limits are anatomical frames local to this hand. The returned effector retains the original material point and the base used to admit it.
 * @evidence contracts/development/implementation.md#principled-implementation Spherical interpolation rotates both axes together between distal contact and pad contact. A reach refusal alone opens the alternative.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordinary fit precedes a bracketed angular fit. Each trial returns its own support solution.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body, region, reach share, sole windows and allowable stride are identical across candidates. A tool or fixed hand frame keeps its refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms A feasible nominal touch takes one stance fit. The rare tip roll refines one verified feasible angular bracket down to the joint angular resolution.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both anatomical frames are prepared once. The admitted stance is retained with the effector that produced it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the latest admitted stance is retained through the bounded search. No candidate history survives it.
 */
export function touchFingerStance<T>(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  requested: IAutoMovieMotionHumanTouchEffector.IEffector,
  mayRoll: boolean,
  fit: (effector: IAutoMovieMotionHumanTouchEffector.IEffector) => T,
): Chosen<T> {
  try {
    return [requested, fit(requested)];
  } catch (original) {
    if (!mayRoll || !reachFailure(original)) throw original;
    const distal: ReturnType<typeof AutoMovieMotionHumanTouchEffector.local> = AutoMovieMotionHumanTouchEffector.local(body, side, requested);
    const axis = (name: IAutoMovieMotionHumanTouchEffector.Axis): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchEffector.axis(side, name);
    const pad: IAutoMovieMotionHumanTouchEffector.IEffector = {
      ...requested, facing: "palm", along: "fingers",
    };
    let best: Chosen<T>;
    try {
      best = [pad, fit(pad)];
    } catch (error) {
      if (reachFailure(error)) throw original;
      throw error;
    }
    const rotation: IAutoMovieQuaternion = HumanHand.align(distal, {
      normal: axis("palm"), forward: axis("fingers"),
    });
    const angle: number = 2 * Math.acos(Math.min(1, Math.abs(rotation.w))) * 180 / Math.PI;
    const direction = (v: IAutoMovieVector3): IAutoMovieMotionHumanTouchEffector.Direction => ({
      fingers: Vector3.dot(v, axis("fingers")),
      palm: Vector3.dot(v, axis("palm")),
      thumb: Vector3.dot(v, axis("thumb")),
    });
    let lo: number = 0;
    let hi: number = 1;
    while ((hi - lo) * angle > ROM_TOLERANCE) {
      const share: number = (lo + hi) / 2;
      const q: IAutoMovieQuaternion = Quaternion.slerp({ x: 0, y: 0, z: 0, w: 1 }, rotation, share);
      const trial: IAutoMovieMotionHumanTouchEffector.IEffector = {
        ...requested,
        facing: direction(Quaternion.rotateVector(q, distal.normal)),
        along: direction(Quaternion.rotateVector(q, distal.forward)),
      };
      try {
        best = [trial, fit(trial)];
        hi = share;
      } catch (error) {
        if (!reachFailure(error)) throw error;
        lo = share;
      }
    }
    return best;
  }
}

/** Only the existing geometric stance refusal admits an alternate tip inclination. */
function reachFailure(error: unknown): boolean {
  return error instanceof HumanRefusal && error.kind === "reach" && error.axis === "target";
}
