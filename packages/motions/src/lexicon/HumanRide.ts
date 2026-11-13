import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Riding: a seated person carried by a support that moves by itself, such
 * as a car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it
 * stands at that second; `HumanMount.saddle` reads a saddle with its pedals
 * or stirrups) and then rides it: the seated posture is carried rigidly
 * with the support, turning, leaning and pitching as it does, the seat and
 * each foot that rested on it bearing on it, so nothing slides in the
 * support's frame. The arms, the hands and the head are yielded, so
 * steering, holding on, waving and looking are actions performed over the
 * ride. Register `HumanRide.ride` to use it.
 *
 * First pass: the rider leans exactly as the support does, does not post
 * to a trot, pedal or absorb a bump, and mounting and dismounting are the
 * sitting actions. The ride passes on the seat it was entered on as its
 * base, so `rise` after it gets off a saddle to the left unasked.
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

    /**
     * A rising trot: the mount's stride time, seconds. The rider stands in
     * the stirrups and sits again once a stride, the seat rising `POST`
     * thigh lengths off the saddle, so both feet must rest on the support.
     * Seated throughout when absent.
     */
    rising?: number;
  }

  /** How far a rising trot lifts the seat off the saddle, thigh lengths (provisional: no rider kinematics were read). */
  export const POST: number = 0.25;

  /** Ride a moving support, seated on it. */
  export const ride: IHumanActionLaw<IParams> = {
    name: "ride",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { on, seconds }: IParams = context.params;
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

      // Any seated entry rides: straight from sitting down, from another ride, or from an act taken seated, which keeps the seated base.
      if (context.entry.base.kind !== "seated")
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: context.entry.base.kind,
          feasible: { kind: "alternatives", values: ["sit", "ride"] },
          reason: `a ride is entered seated on its support, and the performer is ${context.entry.base.kind}`,
          fix: "sit on the support's seat first, then ride it",
        });
      const support: IHumanActionContext.IProp = context.prop(on);
      const seated: IHumanPosture = context.entry.posture;
      const origin: IHumanProp.IFrame = support.frame(context.start);
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


      // A rising trot stands in the stirrups, so it needs both.
      const rising: number | undefined = context.params.rising;
      if (rising !== undefined) {
        HumanBound.above("rising", rising, 0, "s");
        if (!context.entry.feet.left.planted || !context.entry.feet.right.planted)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "rising",
            value: rising,
            feasible: { kind: "alternatives", values: ["seated"] },
            reason: `a rising trot stands in the stirrups, and a foot of the rider rests on nothing`,
            fix: "sit on a saddle whose stirrups both legs reach, or ride seated",
          });
      }

      // A foot bears on the support only where it bore when the ride began: a foot that hangs from a saddle keeps hanging. The seat bears throughout unless the rider rises from it.
      const contacts: IHumanContactWindow[] =
        rising === undefined ? [bears("seat", "seat")] : [];
      for (const side of ["left", "right"] as const)
        if (context.entry.feet[side].planted)
          contacts.push(bears(`${side}Foot`, "plant"));
      const post: number = POST * context.body.measure.thigh;
      const upright: IAutoMovieQuaternion = resolveHumanPosture.heading(seated);
      const turned: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
      return {
        duration: seconds,
        events: [],
        contacts,

        // The seat sat on is passed on, so getting off after the ride still knows it.
        base:
          context.entry.base.kind === "seated"
            ? context.entry.base
            : { kind: "seated" },
        posture: (at: number): IHumanPosture => {
          const now: IHumanProp.IFrame = support.frame(
            context.start + Math.min(seconds, Math.max(0, at)),
          );
          const carried: IHumanPosture = carryHumanPosture(seated, origin, now);

          // The pelvis keeps its place on the seat, so it tips with a support that leans or pitches; the heading stays the unwrapped one the carry gives.
          const tipped: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> =
            resolveHumanPosture.angles(
            Quaternion.multiply(
              Quaternion.multiply(now.rotation, turned),
              upright,
            ),
          );

          // Rising, the seat lifts off the saddle along the mount's own up and comes back once a stride; the feet stay on their rests.
          const lift: number =
            rising === undefined
              ? 0
              : post * Math.sin((Math.PI * at) / rising) ** 2;
          const up: IAutoMovieVector3 = Quaternion.rotateVector(now.rotation, {
            x: 0,
            y: 1,
            z: 0,
          });
          return {
            ...carried,
            root: {
              x: carried.root.x + up.x * lift,
              y: carried.root.y + up.y * lift,
              z: carried.root.z + up.z * lift,
            },
            yaw:
              tipped.yaw + 360 * Math.round((carried.yaw - tipped.yaw) / 360),
            pitch: tipped.pitch,
            roll: tipped.roll,
          };
        },
      };
    },
  };
}
