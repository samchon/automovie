import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";
import { bendLower } from "./bendLower";

/**
 * The least trunk pitch that brings the shoulder within reach of the target
 * under a strategy, over 0 to `DEEPEST` degrees of inclination: the first of
 * every `SCAN` degrees that reaches, refined by bisection from the one before.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @param target The target.
 * @param side The hand.
 * @param strategy The strategy.
 * @param lean The balance shift per unit sine of the inclination, metres.
 * @param reach How near the shoulder must come to the target, metres;
 *   `bendLower.REACH` of the arm plus the palm's offset when absent, a palm
 *   laid on the target.
 * @returns Degrees.
 * @throws {HumanRefusal} When even `DEEPEST` degrees leaves the target out of
 *   reach, with the lowest height the hand reaches above the target's floor
 *   point over the inclinations tried as the feasible range, or none when the
 *   point lies beyond the arm's reach across the floor at all of them.
 */
export function bendLowerPitch(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  target: IAutoMovieVector3,
  side: AutoMovieHumanSide,
  strategy: IAutoMovieMotionHumanBendLower.ISolved["strategy"],
  lean: number,
  reach: number = bendLower.REACH *
    (body.measure.upperArm + body.measure.forearm) +
    Vector3.length(HumanHand.offset(body, side, "palm").point),
  wristAt?: bendLower.WristAt,
  lateral: number = 0,
): number {
  // The lowest height the hand reaches above the target's floor point over
  // the inclinations tried: below a shoulder within reach across the floor,
  // the reach's depth under it.
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const name: AutoMovieHumanoidBone = `${side}UpperArm`;
  const shoulderAt: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(body, new Set([name]));
  const lowerAt: ReturnType<typeof bendLower.prepare> = bendLower.prepare(
    body,
    strategy,
  );
  let lowest: number = Infinity;
  const gap: (deg: number) => number = (deg: number): number => {
    const lowered: IAutoMovieMotionHumanPosture = lowerAt(
      posture,
      deg,
      1,
      lean * Math.sin((deg * Math.PI) / 180),
      read,
      lateral,
    );
    const shoulder: IAutoMovieVector3 = shoulderAt(lowered, read).get(
      name,
    )!.worldPosition;
    const point: IAutoMovieVector3 =
      wristAt === undefined ? target : wristAt(lowered, read);
    const across: number = Math.hypot(
      point.x - shoulder.x,
      point.z - shoulder.z,
    );
    if (across <= reach)
      lowest = Math.min(
        lowest,
        shoulder.y - Math.sqrt(reach * reach - across * across),
      );
    return Vector3.distance(point, shoulder) - reach;
  };
  if (gap(0) <= 0) return 0;
  let hi: number = SCAN;
  while (hi <= DEEPEST && gap(hi) > 0) hi += SCAN;
  if (hi > DEEPEST) {
    const feasible: IAutoMovieMotionHumanRefusal.IRange = {
      kind: "range",
      minimum: lowest,
      maximum: null,
      unit: "m",
    };
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: target.y,
      ...(lowest === Infinity ? {} : { feasible }),
      reason:
        lowest === Infinity
          ? `A ${strategy} cannot bring the hand over a point ${target.y.toFixed(3)} m high there: it lies beyond the arm's reach across the floor at every inclination`
          : `A ${strategy} cannot bring the hand down to a point ${target.y.toFixed(3)} m high there; the lowest it reaches there is ${lowest.toFixed(3)} m`,
      fix: "step closer to the target, or choose a deeper strategy",
    });
  }
  let lo: number = hi - SCAN;
  for (let i: number = 0; i < 30; i++) {
    const mid: number = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * The step of the inclination scan `pitch` closes the reach on, degrees
 * (provisional: fine enough that the gap, which turns once over the range,
 * cannot close and open again between two steps).
 */
const SCAN: number = 5;

/**
 * The deepest trunk inclination `pitch` searches, degrees: all the pelvis can
 * tilt before the hip passes its flexion (`HumanTrunk.HIP_FLEXION`) plus the 40
 * degrees of lumbar flexion at full forward bending (Esola et al. 1996, Spine
 * 21:71), the most a standing trunk inclines.
 */
const DEEPEST: number = HumanTrunk.HIP_FLEXION + 40;
