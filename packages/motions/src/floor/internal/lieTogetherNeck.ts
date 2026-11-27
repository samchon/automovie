import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../../compose/internal/AutoMovieMotionHumanHead";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/*
 * The neck's lift of a cheek onto a partner's chest, lying with the head on the
 * chest: the neck's side bend and flexion, solved on a coarse grid refined by
 * degrees, a miss over `NEAR` refused, and added over a posture's own at a
 * share.
 */
export namespace lieTogetherNeck {
  /*
   * The neck's added flexion and side bend, degrees.
   */
  export interface INeck {
    /*
     * Flexion, degrees.
     */
    flexion: number;

    /*
     * Side bend, degrees.
     */
    tilt: number;
  }

  /*
   * No lift.
   */
  export const NONE: INeck = { flexion: 0, tilt: 0 };

  /*
   * The neck's side bend and flexion at a share, added over the posture's own.
   * Parameter posture: The posture.
   * Parameter n: The lift.
   * Parameter k: The share.
   * Returns: The posture with the lift added.
   */
  export function apply(
    posture: IAutoMovieMotionHumanPosture,
    n: INeck,
    k: number,
  ): IAutoMovieMotionHumanPosture {
    const flexion: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(0, n.flexion * k);
    const bend: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(1, n.tilt * k);
    const added = (bone: NeckBone): readonly [number, number, number] => {
      const held: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      return [held[0] + flexion[bone]![0], held[1] + bend[bone]![1], held[2]];
    };
    return {
      ...posture,
      joints: { ...posture.joints, neck: added("neck"), head: added("head") },
    };
  }

  /*
   * The neck's side bend and flexion that bring a head region nearest a point,
   * or the refusal.
   * Parameter body: The body.
   * Parameter posture: The posture the neck bends from.
   * Parameter own: The head region.
   * Parameter target: The point, world metres.
   * Returns: The lift.
   * When the nearest lift misses the point by more than
   * `NEAR`.
   */
  export function lift(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    own: AutoMovieHumanoidRegion,
    target: IAutoMovieVector3,
  ): INeck {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const point: ReturnType<typeof HumanTrunk.preparePoint> =
      HumanTrunk.preparePoint(body, own);
    const miss = (n: INeck): number =>
      Vector3.distance(point(apply(posture, n, 1), resolution), target);
    let best: INeck = NONE;
    let least: number = miss(best);
    const visit = (n: INeck): void => {
      const m: number = miss(n);
      if (m < least) {
        least = m;
        best = n;
      }
    };
    for (let flexion: number = -30; flexion <= 45; flexion += 5)
      for (let tilt: number = -40; tilt <= 40; tilt += 4)
        visit({ flexion, tilt });
    const coarse: INeck = best;
    for (
      let flexion: number = Math.max(-30, coarse.flexion - 4);
      flexion <= Math.min(45, coarse.flexion + 4);
      ++flexion
    )
      for (
        let tilt: number = Math.max(-40, coarse.tilt - 3);
        tilt <= Math.min(40, coarse.tilt + 3);
        ++tilt
      )
        visit({ flexion, tilt });
    if (least > NEAR)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "way",
        value: "chest",
        feasible: { kind: "range", minimum: null, maximum: NEAR, unit: "m" },
        reason: `the ${own} stays ${(least * 1000).toFixed(0)} mm from the partner's chest with the neck flexed ${best.flexion} and bent ${best.tilt} degrees`,
        fix: "lie nearer the partner's chest, or spoon instead",
      });
    return best;
  }
}

/*
 * The miss under which the cheek rests on the chest, metres (provisional: a
 * skin contact, as `headRest`'s).
 */
const NEAR: number = 0.01;

/*
 * The neck's two bones a resting head bends over.
 */
type NeckBone = "neck" | "head";
