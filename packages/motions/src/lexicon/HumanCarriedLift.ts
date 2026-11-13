import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { tags } from "typia";

import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The lift into a carry and the set-down out of it (#3349): the carried
 * body leaves the posture it was entered in for the carry's over the first
 * `lift` seconds, and over the last `setDown` seconds comes down to stand
 * where the carrier has brought it.
 *
 * Both are a blend on minimum-jerk progress between two whole postures: the
 * root travels straight between them, the heading, the tilt and the joints
 * go with it, and the carry's own posture keeps following the carrier
 * meanwhile, so the body arrives on a carrier who walks. The carried body's
 * contact with the carrier is declared only between the two, while it
 * rests there.
 *
 * First pass: the body is carried through the blend by nothing that is
 * shown (the carrier's hands arrive by `bearing`'s own take-up, and no hand
 * is placed under the body while it rises); the arms that cling take their
 * hold at the blend's half, since a limb goal cannot be weighted; the body
 * is set down standing, whatever the carry, on the floor under where its
 * root is carried.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the two phases do, what the blend is, when the contact is declared and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A wrapper of the carried plan: the carry's law is unchanged and the two phases are one blend each over its posture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two parameters and the wrapper `borne` returns through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts With neither parameter given the plan is returned as it is, so a carry without the phases is what it was.
 */
export namespace HumanCarriedLift {
  /** The two phases' lengths. */
  export interface IParams {
    /** Seconds the lift into the carry takes, at the start; none when absent. */
    lift?: number & tags.Minimum<0>;

    /** Seconds the set-down takes, at the end; none when absent. */
    setDown?: number & tags.Minimum<0>;
  }

  /**
   * A carried plan with its lift and its set-down.
   *
   * @param context The carried person's context.
   * @param plan The plan of the carry itself, whose posture follows the carrier.
   * @returns The plan with the two phases; `plan` itself when neither is asked.
   * @throws {HumanRefusal} When a phase is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The posture at a second is the carry's own, blended from the entry posture while the lift lasts and toward a stand under the carried root while the set-down lasts; phases longer than the carry are scaled to fill it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two weights, one blend, the contact windows cut to the hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heading is blended the short way round; a limb goal is taken whole at the half, stated on the namespace.
   * @evidence contracts/development/implementation.md#efficient-algorithms One blend over the joints per evaluated second of a phase.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; nothing is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the carry's plan and the entry posture.
   */
  export function over(
    context: IHumanActionContext<IParams>,
    plan: IHumanActionPlan,
  ): IHumanActionPlan {
    const asked: readonly [number, number] = [
      HumanBound.least("lift", context.params.lift ?? 0, 0, "s"),
      HumanBound.least("setDown", context.params.setDown ?? 0, 0, "s"),
    ];
    if (asked[0] + asked[1] === 0) return plan;
    const fit: number = Math.min(1, plan.duration / (asked[0] + asked[1]));
    const lift: number = asked[0] * fit;
    const setDown: number = asked[1] * fit;
    const entry: IHumanPosture = context.entry.posture;
    const ease = (x: number): number => {
      const u: number = Math.min(1, Math.max(0, x));
      return u * u * u * (u * (6 * u - 15) + 10);
    };
    const mix = (
      from: IHumanPosture,
      to: IHumanPosture,
      w: number,
    ): IHumanPosture => {
      if (w <= 0) return from;
      if (w >= 1) return to;
      const joints: IHumanPosture["joints"] = {};
      for (const bone of new Set([
        ...Object.keys(from.joints),
        ...Object.keys(to.joints),
      ]) as Set<AutoMovieHumanoidBone>) {
        const a: readonly [number, number, number] = from.joints[bone] ?? [
          0, 0, 0,
        ];
        const b: readonly [number, number, number] = to.joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          a[0] + (b[0] - a[0]) * w,
          a[1] + (b[1] - a[1]) * w,
          a[2] + (b[2] - a[2]) * w,
        ];
      }
      const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
      return {
        root: {
          x: from.root.x + (to.root.x - from.root.x) * w,
          y: from.root.y + (to.root.y - from.root.y) * w,
          z: from.root.z + (to.root.z - from.root.z) * w,
        },
        yaw: from.yaw + turn * w,
        pitch: from.pitch + (to.pitch - from.pitch) * w,
        roll: from.roll + (to.roll - from.roll) * w,
        joints,
        limbs: w < 0.5 ? {} : to.limbs,
      };
    };
    return {
      ...plan,
      events: [
        ...plan.events,
        { name: "lifted", share: lift / plan.duration },
        { name: "setDown", share: 1 - setDown / plan.duration },
      ],
      contacts: plan.contacts.map(
        (window: IHumanContactWindow): IHumanContactWindow => ({
          ...window,
          from: Math.max(window.from, lift / plan.duration),
          to: Math.min(window.to, 1 - setDown / plan.duration),
        }),
      ),
      posture: (at: number): IHumanPosture => {
        const held: IHumanPosture = plan.posture(at);
        if (lift > 0 && at < lift) return mix(entry, held, ease(at / lift));
        if (setDown > 0 && at > plan.duration - setDown)
          return mix(
            held,
            {
              ...entry,
              root: { x: held.root.x, y: entry.root.y, z: held.root.z },
              yaw: held.yaw,
              limbs: {},
            },
            ease((at - (plan.duration - setDown)) / setDown),
          );
        return held;
      },
    };
  }
}
