import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspUse } from "./HumanGraspUse";
import type { pickUp } from "./pickUp";
import { pickUpPosture } from "./pickUpPosture";

/**
 * The grasp a pick up chooses from a stance (`pickUp`): the grip's turn and
 * tilt the arm reaches best, judged by the fit over the grasp, the lifted
 * pose and any use's pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is chosen and by what.
 * @evidence contracts/development/design.md#principled-representation The search result as one record of the chosen grasp, the elbow hint and the stance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and the search the pick up reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop is named: the grip is the prop's declared affordance.
 */
export namespace pickUpSearch {
  /** A grasp chosen from a stance, the elbow hint its arm hangs by, and the stance. */
  export interface ISearched {
    /** The grasp the arm reaches best. */
    chosen: HumanGrasp.IReach;

    /** The elbow hint the arm hangs by, world metres. */
    bend: IAutoMovieVector3;

    /** The body the arm reaches from. */
    stance: pickUpPosture.IStance;
  }

  /**
   * The grasp the arm reaches best from a stance's posture, the lifted pose and any use's pose its keys (`HumanGrasp.reachable`).
   *
   * @param context The pick up's context.
   * @param side The reaching hand.
   * @param lift How far the prop is lifted, metres.
   * @param authored The grip as the prop declares it.
   * @param stance The body the arm reaches from.
   * @returns The chosen grasp, the elbow hint and the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The grip's turns and tilts judged by the arm's fit over the grasp, the lift and any use's pose (`HumanGrasp.reachable`), the use's pose first when one is asked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The elbow hint, the hand's own rotation per place, the goals, one search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grasp beyond the straight arm is tried only when every one is.
   * @evidence contracts/development/implementation.md#efficient-algorithms The hand's own rotation is fitted once per place.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The per-place rotations are cached for the search.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
   */
  export function of(
    context: IHumanActionContext<pickUp.IParams>,
    side: HumanHand.Side,
    lift: number,
    authored: HumanGrasp.ITarget,
    stance: pickUpPosture.IStance,
  ): ISearched {
    const body: IHumanBody = context.body;
    const held: IHumanPosture = stance.posture;
    // The same grip must still hold at the top of the lift, so the lifted
    // pose is a key of the choice.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );

    // The hand's own rotation at a place: what the arm gives it there when
    // no rotation is asked. Fitted once per place.
    const limbOf: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const owned: Map<string, IAutoMovieQuaternion> = new Map();
    const natural = (point: IAutoMovieVector3): IAutoMovieQuaternion => {
      const key: string = `${point.x},${point.y},${point.z}`;
      let found: IAutoMovieQuaternion | undefined = owned.get(key);
      if (found === undefined) {
        found =
          poseBones(
            body,
            resolveHumanPosture(body, {
              ...held,
              limbs: { ...held.limbs, [limbOf]: { point, bend } },
            }),
          ).get(`${side}Hand`)?.worldRotation ?? Quaternion.identity();
        owned.set(key, found);
      }
      return found;
    };
    const goal = (turn: number, tilt: number): HumanHand.IWrist =>
      HumanGrasp.hand(body, side, HumanGrasp.around(authored, turn), tilt);
    const tilts: readonly number[] =
      context.params.use === undefined
        ? [-45, -30, -15, 0, 15, 30, 45]
        : HumanGraspUse.OBLIQUE;
    const turnsAsked: readonly number[] =
      context.params.use === undefined
        ? HumanGrasp.TURNS
        : HumanGraspUse.AROUND;
    // A grasp whose wrist lies beyond the straight arm is tried only when
    // every one does: the choice and the refusal below read the same reach,
    // so a grip a millimetre beyond it is never chosen over one within it for
    // a cheaper fit. Each turn and tilt is judged on its own; a turn kept
    // only while all its tilts were within reach fell back to every turn when
    // none kept all seven, and a glass across the body was refused a grip
    // 9 mm beyond the arm while others lay within it.

    const chosen: HumanGrasp.IReach = HumanGrasp.reachable(
      body,
      held,
      side,
      bend,
      goal,
      tilts,
      (wrist: HumanHand.IWrist, shown: HumanHand.IWrist): HumanGrasp.IKey[] => [
        ...(lift > 0
          ? [
              {
                posture: held,
                // Lifted, the hand keeps the rotation it shows at the grasp,
                // as the lift holds it (`HumanHandAttitude`).
                wrist: {
                  point: { ...wrist.point, y: wrist.point.y + lift },
                  rotation: shown.rotation,
                },
                bend,
              },
            ]
          : []),
        ...(context.params.use === undefined
          ? []
          : [
              HumanGraspUse.presented({
                context,
                prop: context.params.prop,
                handle: context.params.handle,
                side,

                // The tool is rigid in the hand the arm shows at the grasp,
                // which may differ from the hand asked: the fingers close
                // on it where it is shown.
                wrist: shown,
                use: context.params.use,
                natural,
              }),
            ]),
      ],

      // A grasp for a use may have to come from the far side of the handle.
      turnsAsked,

      // A grasp that holds the use's pose comes before any that does not,
      // whatever else each costs; the use's pose is the stroke's last key.
      context.params.use === undefined
        ? undefined
        : {
            bound: HumanGraspUse.UNMET,
            measure: (keys: readonly number[]): number =>
              keys[keys.length - 1] ?? 0,
          },
      pickUpPosture.reaches(context, side, held),
    );
    return { chosen, bend, stance };
  }
}
