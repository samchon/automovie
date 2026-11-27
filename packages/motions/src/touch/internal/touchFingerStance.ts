import { AutoMovieEngineQuaternion, AutoMovieEngineRomTolerance, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * Fit the requested hand and grounded stance. A bare fingertip may roll from
 * its distal face towards its palmar pad while retaining its actual tip site.
 * Prefer the authored contact frame, then refine an admitted rotation in the
 * bracket between it and the flat pad. Each admitted frame uses the same
 * support and reach tests as the original.
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
    const distal: ReturnType<typeof AutoMovieMotionHumanTouchEffector.local> =
      AutoMovieMotionHumanTouchEffector.local(body, side, requested);
    const axis = (
      name: IAutoMovieMotionHumanTouchEffector.Axis,
    ): IAutoMovieVector3 => AutoMovieMotionHumanTouchEffector.axis(side, name);
    const pad: IAutoMovieMotionHumanTouchEffector.IEffector = {
      ...requested,
      facing: "palm",
      along: "fingers",
    };
    let best: Chosen<T>;
    try {
      best = [pad, fit(pad)];
    } catch (error) {
      if (reachFailure(error)) throw original;
      throw error;
    }
    const rotation: IAutoMovieQuaternion = HumanHand.align(distal, {
      normal: axis("palm"),
      forward: axis("fingers"),
    });
    const angle: number =
      (2 * Math.acos(Math.min(1, Math.abs(rotation.w))) * 180) / Math.PI;
    const direction = (
      v: IAutoMovieVector3,
    ): IAutoMovieMotionHumanTouchEffector.Direction => ({
      fingers: AutoMovieEngineVector3.dot(v, axis("fingers")),
      palm: AutoMovieEngineVector3.dot(v, axis("palm")),
      thumb: AutoMovieEngineVector3.dot(v, axis("thumb")),
    });
    let lo: number = 0;
    let hi: number = 1;
    while ((hi - lo) * angle > AutoMovieEngineRomTolerance) {
      const share: number = (lo + hi) / 2;
      const q: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
        { x: 0, y: 0, z: 0, w: 1 },
        rotation,
        share,
      );
      const trial: IAutoMovieMotionHumanTouchEffector.IEffector = {
        ...requested,
        facing: direction(AutoMovieEngineQuaternion.rotateVector(q, distal.normal)),
        along: direction(AutoMovieEngineQuaternion.rotateVector(q, distal.forward)),
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

/*
 * The hand frame and the base admitted for that frame.
 */
type Chosen<T> = readonly [IAutoMovieMotionHumanTouchEffector.IEffector, T];

/*
 * Only the existing geometric stance refusal admits an alternate tip
 * inclination.
 */
function reachFailure(error: unknown): boolean {
  return (
    error instanceof AutoMovieMotionHumanRefusal &&
    error.kind === "reach" &&
    error.axis === "target"
  );
}
