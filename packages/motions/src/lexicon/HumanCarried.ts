import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { carryHumanPosture } from "../posture/carryHumanPosture";

/**
 * Being carried by another person: on the back, in the arms or over a
 * shoulder. The carried person keeps the posture they are in and goes
 * rigidly with one bone of the carrier (the upper chest when none is
 * named), so whatever the carrier does (walk, turn, stoop) takes them
 * along. The carrier performs their own action, such as a carry of the
 * load in both hands. Register `HumanCarried.carried` to use it.
 *
 * First pass: the lift into the carry and the set-down are not planned,
 * the carried body does not sag or cling, and its weight does not lean the
 * carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what being carried is here, what the carrier does and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record whose posture is the entry posture moved by one bone of the carrier, with a contact window that names the carrier as its frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its parameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The carrier's motion is read from the performance, never restated in the carried person's parameters.
 */
export namespace HumanCarried {
  /** Parameters of being carried. */
  export interface IParams {
    /** The carrier's subject id. */
    by: string;

    /** The carrier's bone the body goes with; the upper chest when absent. */
    on?: AutoMovieHumanoidBone;

    /** Seconds carried. */
    seconds: number;
  }

  /** Be carried by another person. */
  export const carried: IHumanActionLaw<IParams> = {
    name: "carried",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    },
    yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const { by, seconds } = context.params;
      const bone: AutoMovieHumanoidBone = context.params.on ?? "upperChest";
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
          reason: "being carried lasts a positive time",
          fix: "give the seconds carried",
        });
      if (by === context.subject)
        throw new HumanRefusal({
          kind: "participant",
          axis: "by",
          value: by,
          reason: "a person is carried by someone else",
          fix: "name the carrier",
        });
      const carrier = context.performer(by);
      const held: IHumanPosture = context.entry.posture;
      const frame = (at: number): carryHumanPosture.IFrame => {
        const resolved = carrier.bones(context.start + at).get(bone);
        if (resolved === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "on",
            value: bone,
            reason: `the carrier has no bone ${bone}`,
            fix: "name a bone of the carrier's rig",
          });
        return {
          position: resolved.worldPosition,
          rotation: resolved.worldRotation,
        };
      };

      // The carrier's bones may be read only once a posture is asked.
      let origin: carryHumanPosture.IFrame | undefined;
      return {
        duration: seconds,
        events: [],
        contacts: [
          {
            part: "seat",
            kind: "seat",
            from: 0,
            to: 1,
            support: { kind: "person", subject: by, region: "upperBack" },
          },
        ],
        posture: (at: number): IHumanPosture => {
          origin ??= frame(0);
          return carryHumanPosture(
            held,
            origin,
            frame(Math.min(seconds, Math.max(0, at))),
          );
        },
      };
    },
  };
}
