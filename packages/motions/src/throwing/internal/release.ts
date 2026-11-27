import {
  AutoMovieEngineMotionTrajectory,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRelease,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBendTrack } from "../../compose/internal/AutoMovieMotionHumanBendTrack";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanHand } from "../../posture/internal/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold; at
 * `open` the prop is launched (`IHumanActionPlan.launches`) with the hand's
 * velocity there, the central difference of the carried grip point at the
 * engine's plan-time step (`AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()`), so a drop from a
 * still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string) is launched by `launch` instead: along its line from one of its
 * points to another, at the speed the launcher gives (a bow's `launchSpeed` at
 * the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand that
 * holds nothing is refused.
 */
export namespace release {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "release";

  /*
   * Cancel table: anything may follow once the hand has opened.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      {
        window: { start: "open", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
      },
    ],
  };

  /*
   * Performed over a carrier: it claims only the opening hand's arm.
   */
  export const overlay: boolean = true;

  /*
   * A release's timetable: the grip held a brief pause, then opened over
   * another.
   * Returns: The clock with `hold` and `open`.
   */
  export function timetable(): IAutoMovieMotionClock {
    return AutoMovieMotionClock.sequence([
      { name: "hold", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
      { name: "open", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
    ]);
  }
  /*
   * Plan a release.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hand holds nothing and no prop is launched.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelease.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
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
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>(["chest", `${side}Hand`]),
    );
    const chest: IAutoMovieRigidTransform = HumanPropFrame.bone(
      bones.get("chest")!,
    );
    const grip: IAutoMovieRigidTransform = {
      position: HumanHand.preparePoint(body, side, "grip")(bones),
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
    const kept: IAutoMovieRigidTransform = HumanPropFrame.relative(chest, grip);
    const clock: IAutoMovieMotionClock = timetable();
    const open: number = clock.at("open");
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const carried: (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => IAutoMovieRigidTransform = (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieRigidTransform =>
      HumanPropFrame.compose(
        HumanPropFrame.bone(
          HumanTrunk.resolve(
            body,
            posture,
            undefined,
            resolution,
            HumanBoneGroups.CHEST,
          ).get("chest")!,
        ),
        kept,
      );
    const offsets: Record<OffsetsEntryItem, IAutoMovieVector3> = {
      fist: { ...HumanHand.offset(body, side, "grip", "fist").point },
      flat: { ...HumanHand.offset(body, side, "grip", "flat").point },
    };
    const placed: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => IPlanPlaced = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IPlanPlacedResult => {
      const at: IAutoMovieRigidTransform = carried(posture, resolution);
      const shape: PlanPlacedShape = seconds < open ? "fist" : "flat";
      const contact: IAutoMovieVector3 = offsets[shape];
      return {
        wrist: placeHumanHandSurface(contact, at.position, at.rotation),
        contact,
      };
    };

    // The elbow is solved once over the span, when the action is planned,
    // and continued through it (`AutoMovieMotionHumanBendTrack`).
    const elbow: AutoMovieMotionHumanBendTrack.ITrack =
      AutoMovieMotionHumanBendTrack({
        body,
        side,
        from: 0,
        to: clock.duration,
        fallback: "hang",
        goal: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanHand.IWrist => placed(posture, seconds).wrist,
      });
    const hand: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Arm`, `${side}Hand`],
      from: 0,
      to: clock.duration,
      prepare: (before: IAutoMovieMotionHumanPrimitive.Reader): void =>
        elbow.prepare(before),
      ...(held === undefined
        ? {}
        : {
            contacts: [
              {
                part: `${side}Hand`,
                kind: "grip",
                from: 0,
                to: open / clock.duration,
                support: { kind: "prop", subject: held },
              },
            ],
          }),
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
        const { wrist, contact }: ReturnType<typeof placed> = placed(
          posture,
          seconds,
          resolution,
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${side}Arm`]: AutoMovieMotionHumanArmTarget.fromWrist(
              wrist,
              elbow.elbow(posture, seconds, wrist),
              { ...contact },
            ),
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
    const h: number =
      AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep();
    const point: (s: number) => IAutoMovieVector3 = (
      s: number,
    ): IAutoMovieVector3 =>
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
    const launch: IAutoMovieMotionHumanRelease.IParams["launch"] =
      context.params.launch;
    if (launch !== undefined) {
      const prop: IAutoMovieMotionHumanPropReader = context.prop(launch.prop);
      const frame: IAutoMovieRigidTransform = prop.frame(context.start + open);
      const place: (id: string) => IAutoMovieVector3 = (
        id: string,
      ): IAutoMovieVector3 => {
        const local: IAutoMovieMotionHumanProp["points"][string] | undefined =
          prop.prop.points[id];
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

/*
 * The alternatives of `PlanPlacedShape`'s site.
 */
type PlanPlacedShape = "fist" | "flat";

/*
 * The record of `IPlanPlacedResult`'s site.
 */
type IPlanPlacedResult = {
  wrist: IAutoMovieMotionHumanHand.IWrist;
  contact: IAutoMovieVector3;
};

/*
 * The record of `IPlanPlaced`'s site.
 */
type IPlanPlaced = {
  wrist: IAutoMovieMotionHumanHand.IWrist;
  contact: IAutoMovieVector3;
};

/*
 * The alternatives of `OffsetsEntryItem`'s site.
 */
type OffsetsEntryItem = "fist" | "flat";
