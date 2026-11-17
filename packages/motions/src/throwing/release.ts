import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRelease,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";

/**
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold;
 * at `open` the prop is launched (`IHumanActionPlan.launches`) with the
 * hand's velocity there, the central difference of the carried grip point at
 * the engine's plan-time step (`integrateMotionTrajectory.STEP`), so a drop
 * from a still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string, #3487) is launched by `launch` instead: along its line from one of
 * its points to another, at the speed the launcher gives (a bow's
 * `launchSpeed` at the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand
 * that holds nothing is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the hand does, the decisive instant, the launch velocity's derivation, the launcher case, the overlay and the refusal.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm primitive over the carrier, a grip window ending at the opening and a launch there.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The velocity is the hand's own; the opening time reads the shared pause table.
 */
export namespace release {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "release";

  /** Cancel table: anything may follow once the hand has opened. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["open", 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /** Performed over a carrier: it claims only the opening hand's arm. */
  export const overlay: boolean = true;

  /**
   * Plan a release.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand holds nothing and no prop is launched.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelease.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body = context.body;
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const held: string | undefined =
      context.params.prop ?? context.entry.holds[side];
    if (held === undefined && context.params.launch === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "hand",
        value: side,
        reason: `${context.subject}'s ${side} hand holds nothing to let go of`,
        fix: "take a prop in that hand first, or release the other hand",
      });

    // The grip's frame at the entry, kept in the chest's frame.
    const bones = poseBones(body, context.entry.pose);
    const chest: IAutoMovieRigidTransform = HumanPropFrame.bone(
      bones.get("chest")!,
    );
    const grip: IAutoMovieRigidTransform = {
      position: HumanHand.frame(body, bones, side, "grip").point,
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
    const kept: IAutoMovieRigidTransform = HumanPropFrame.relative(chest, grip);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.sequence([
      { name: "hold", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
      { name: "open", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
    ]);
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieRigidTransform =>
      HumanPropFrame.compose(
        HumanPropFrame.bone(HumanTrunk.resolve(body, posture).get("chest")!),
        kept,
      );
    const hand: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Arm`, `${side}Hand`],
      from: 0,
      to: clock.duration,
      ...(held === undefined
        ? {}
        : {
            contacts: [
              {
                part: `${side}Hand`,
                kind: "grip",
                from: 0,
                to: clock.at("open") / clock.duration,
                support: { kind: "prop", subject: held },
              },
            ],
          }),
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const at: IAutoMovieRigidTransform = carried(posture);
        const shape: IAutoMovieMotionHumanHand.Shape =
          seconds < clock.at("open") ? "fist" : "flat";
        const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
          body,
          side,
          "grip",
          at.position,
          at.rotation,
          shape,
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${side}Arm`]: AutoMovieMotionHumanArm.goal(body, side, {
              surface: "grip",
              shape,
              point: at.position,
              rotation: at.rotation,
              bend: AutoMovieMotionHumanBend.solve({
                body,
                posture,
                side,
                point: wrist.point,
                rotation: at.rotation,
                fallback: "hang",
              }),
            }),
          },
        };
      },
    };
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "open",
        primitives: [hand],
      });

    // The hand's velocity at the opening, from the carrier's motion.
    const open: number = clock.at("open");
    const h: number = integrateMotionTrajectory.STEP;
    const point = (s: number): IAutoMovieVector3 =>
      carried(base.posture(Math.max(0, Math.min(clock.duration, s)))).position;
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(point(open + h), point(open - h)),
      1 / (2 * h),
    );
    const launches: IAutoMovieMotionPropLaunch[] = [];
    if (held !== undefined && context.params.launch?.prop !== held)
      launches.push({
        prop: held,
        seconds: open,
        point: point(open),
        velocity,
      });
    const launch = context.params.launch;
    if (launch !== undefined) {
      const prop = context.prop(launch.prop);
      const frame: IAutoMovieRigidTransform = prop.frame(context.start + open);
      const place = (id: string): IAutoMovieVector3 => {
        const local = prop.prop.points[id];
        if (local === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "launch",
            value: `${launch.prop}.${id}`,
            feasible: {
              kind: "alternatives",
              values: Object.keys(prop.prop.points),
            },
            reason: `${launch.prop} has no point named ${id}`,
            fix: "name points the launched prop declares",
          });
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, local.point),
        );
      };
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(place(launch.to), place(launch.from)),
      );
      launches.push({
        prop: launch.prop,
        seconds: open,
        point: frame.position,
        velocity: Vector3.add(velocity, Vector3.scale(along, launch.speed)),
        rotation: frame.rotation,
      });
    }
    return { ...composed, launches };
  }
}
