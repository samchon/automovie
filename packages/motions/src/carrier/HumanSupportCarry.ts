import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSupportFrame } from "./HumanSupportFrame";

/**
 * The one owner of goals in a moving support's frame (#3491): a posture
 * planned in the world at an action's start, expressed in the support's
 * frame there and carried back to the world at every second by the
 * support's rigid motion since then. A stance on a cart's bed, a bow held on
 * its target from a cantering horse and a carbine presented from a moving
 * car all plan once at their start and are carried this way, so a goal on
 * the support stays on it and the plan stays a pure function of its seconds.
 *
 * The carry is the rigid transform `D(t) = F(t) F(start)^-1` of the
 * support's frame `F`: a point `p` goes to `F(t) F(start)^-1 p`, a rotation
 * is turned by the support's turn, and the heading by that turn's yaw about
 * the vertical. A goal attached to a bone (`IHumanPosture.IGoal.on`) rides
 * its bone already and is left alone. On the ground the carry is the
 * identity, so nothing changes there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is carried, by which transform, what is left alone and why the plan stays pure.
 * @evidence contracts/development/design.md#principled-representation A rigid transform of SE(3) between the support's frame at the start and at a second, applied to a posture's world quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The carry by a frame function, a posture carried, and a plan carried with the channels it claims.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The support's frame is read through its one reader (`HumanSupportFrame`) or the prop's own frame; nothing is extrapolated.
 */
export namespace HumanSupportCarry {
  /** A support's rigid motion since a start. */
  export interface ICarry {
    /** A world point at the start, where the support has carried it. */
    point(p: IAutoMovieVector3): IAutoMovieVector3;

    /** The support's turn since the start. */
    turn: IAutoMovieQuaternion;

    /** That turn's yaw about the vertical, degrees. */
    yaw: number;
  }

  /**
   * The carry from a start to a second of a support whose frame a function
   * gives.
   *
   * @param frame The support's world frame at a film second.
   * @param start The film second the posture was planned at.
   * @param seconds The film second carried to.
   * @returns The carry.
   */
  export function of(
    frame: (seconds: number) => IHumanProp.IFrame,
    start: number,
    seconds: number,
  ): ICarry {
    const first: IHumanProp.IFrame = frame(start);
    const now: IHumanProp.IFrame = frame(seconds);
    const turn: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(now.rotation, Quaternion.inverse(first.rotation)),
    );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: 0,
      y: 0,
      z: 1,
    });
    return {
      point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          now.position,
          Quaternion.rotateVector(turn, Vector3.subtract(p, first.position)),
        ),
      turn,
      yaw: (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI,
    };
  }

  /**
   * A posture carried: its root, its heading and every limb goal not
   * attached to a bone moved by the carry; joint angles are the body's own
   * and stay.
   *
   * @param carry The carry.
   * @param posture The posture planned at the start.
   * @returns The carried posture.
   */
  export function posture(
    carry: ICarry,
    posture: IHumanPosture,
  ): IHumanPosture {
    const limbs: IHumanPosture["limbs"] = {};
    for (const [limb, goal] of Object.entries(posture.limbs) as [
      keyof IHumanPosture["limbs"],
      IHumanPosture.IGoal,
    ][])
      limbs[limb] =
        goal.on !== undefined
          ? goal
          : {
              ...goal,
              point: carry.point(goal.point),
              bend: carry.point(goal.bend),
              ...(goal.contact === undefined
                ? {}
                : { contact: carry.point(goal.contact) }),
              ...(goal.rotation === undefined
                ? {}
                : {
                    rotation: Quaternion.normalize(
                      Quaternion.multiply(carry.turn, goal.rotation),
                    ),
                  }),
            };
    return {
      ...posture,
      root: carry.point(posture.root),
      yaw: posture.yaw + carry.yaw,
      limbs,
    };
  }

  /**
   * A plan carried by the support its action is entered on
   * (`HumanSupportFrame`), claiming the channels it writes over its carrier:
   * the plan an act made in the world at its start, kept on the support.
   *
   * @param context The action's context.
   * @param plan The plan made at the start.
   * @param channels The channels the plan claims over its carrier.
   * @returns The carried plan.
   */
  export function plan(
    context: Pick<IHumanActionContext, "entry" | "prop" | "performer" | "start">,
    plan: IHumanActionPlan,
    channels: NonNullable<IHumanActionPlan["channels"]>,
  ): IHumanActionPlan {
    // On the ground there is nothing to carry: the plan is kept as made.
    if (HumanSupportFrame.of(context).kind === "ground")
      return { ...plan, channels };
    const frame = (seconds: number): IHumanProp.IFrame => {
      const at: HumanSupportFrame.IFrame = HumanSupportFrame.at(
        context,
        seconds,
      );
      return { position: at.position, rotation: at.rotation };
    };
    return {
      ...plan,
      channels,
      posture: (seconds: number): IHumanPosture =>
        posture(
          of(frame, context.start, context.start + seconds),
          plan.posture(seconds),
        ),
    };
  }
}
