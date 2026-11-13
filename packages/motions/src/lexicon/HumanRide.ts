import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Riding: a seated person carried by a support that moves by itself, such
 * as a car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it
 * stands at that second) and then rides it: the seated posture is carried
 * rigidly with the support, the seat and both feet bearing on it, so
 * nothing slides in the support's frame. The arms, the hands and the head
 * are yielded, so steering, holding on, waving and looking are actions
 * performed over the ride. Register `HumanRide.ride` to use it.
 *
 * First pass: the rider does not lean into turns, post to a trot or absorb
 * a bump, and mounting and dismounting are the sitting actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what riding is here, how it is composed, what it yields and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record whose posture is the entry's seated posture moved by the support's rigid motion, with contact windows that name the support as their frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its parameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The support's motion is read from the performance's prop, never from parameters of the rider's own.
 */
export namespace HumanRide {
  /** Parameters of a ride. */
  export interface IParams {
    /** The moving prop ridden: its subject id in the performance. */
    on: string;

    /** Seconds ridden. */
    seconds: number;
  }

  /** Ride a moving support, seated on it. */
  export const ride: IHumanActionLaw<IParams> = {
    name: "ride",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { on, seconds } = context.params;
      if (!(seconds > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "seconds",
          value: seconds,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: "a ride lasts a positive time",
          fix: "give the seconds ridden",
        });
      const from = context.entry.from;
      if (from === undefined || (from.family !== "sit" && from.name !== "ride"))
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: from?.name ?? "standing",
          feasible: { kind: "alternatives", values: ["sit", "ride"] },
          reason: `a ride is entered seated on its support, and the performer comes from ${from?.name ?? "standing"}`,
          fix: "sit on the support's seat first, then ride it",
        });
      const support = context.prop(on);
      const seated: IHumanPosture = context.entry.posture;
      const origin: IHumanProp.IFrame = support.frame(context.start);
      const back: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
      const heading = (rotation: IAutoMovieQuaternion): number => {
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
          x: 0,
          y: 0,
          z: 1,
        });
        return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
      };
      const bears = (
        part: IHumanContactWindow["part"],
        kind: IHumanContactWindow["kind"],
      ): IHumanContactWindow => ({
        part,
        kind,
        from: 0,
        to: 1,
        support: { kind: "prop", subject: on },
      });
      return {
        duration: seconds,
        events: [],
        contacts: [
          bears("seat", "seat"),
          bears("leftFoot", "plant"),
          bears("rightFoot", "plant"),
        ],
        posture: (at: number): IHumanPosture => {
          // The support's rigid motion since the ride began carries every
          // world point of the seated posture.
          const now: IHumanProp.IFrame = support.frame(
            context.start + Math.min(seconds, Math.max(0, at)),
          );
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            now.rotation,
            back,
          );
          const carry = (point: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(
              now.position,
              Quaternion.rotateVector(
                turn,
                Vector3.subtract(point, origin.position),
              ),
            );
          const limbs: IHumanPosture["limbs"] = {};
          for (const limb of [
            "leftLeg",
            "rightLeg",
            "leftArm",
            "rightArm",
          ] as const) {
            const goal: IHumanPosture.IGoal | undefined = seated.limbs[limb];
            if (goal === undefined) continue;
            limbs[limb] =
              goal.on !== undefined
                ? goal
                : {
                    ...goal,
                    point: carry(goal.point),
                    bend: carry(goal.bend),
                    ...(goal.rotation === undefined
                      ? {}
                      : { rotation: Quaternion.multiply(turn, goal.rotation) }),
                  };
          }
          return {
            ...seated,
            root: carry(seated.root),
            yaw: seated.yaw + heading(now.rotation) - heading(origin.rotation),
            limbs,
          };
        },
      };
    },
  };
}
