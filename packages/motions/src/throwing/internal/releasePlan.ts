import {
  AutoMovieEngineMotionTrajectory,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
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

import { AutoMovieMotionHumanArmAngles } from "../../compose/internal/AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { motionClock } from "../../compose/internal/motionClock";
import { motionHumanBendTrack } from "../../compose/internal/motionHumanBendTrack";
import { motionHumanTiming } from "../../compose/internal/motionHumanTiming";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Plan the releasing hand and prop. A stock court push can continue its
 * active grip's displayed elbow and finger coordinates.
 */
export function releasePlan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRelease.IParams>,
  continueHeldArm: boolean,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  const held: string | undefined =
    context.params.prop ?? context.entry.holds[side];
  if (held === undefined && context.params.launch === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "hand",
      value: side,
      reason: `${context.subject}'s ${side} hand holds nothing to let go of`,
      fix: "take a prop in that hand first, or release the other hand",
    });

  // The grip's frame at the entry, kept in the chest's frame.
  const requested = new Set<AutoMovieHumanoidBone>(["chest", `${side}Hand`]);
  if (continueHeldArm) requested.add(`${side}LowerArm`);
  const bones = poseBones(body, context.entry.pose, undefined, requested);
  const chest: IAutoMovieRigidTransform = HumanPropFrame.bone(
    bones.get("chest")!,
  );
  const grip: IAutoMovieRigidTransform = {
    position: HumanHand.preparePoint(body, side, "grip")(bones),
    rotation: bones.get(`${side}Hand`)!.worldRotation,
  };
  const kept: IAutoMovieRigidTransform = HumanPropFrame.relative(chest, grip);
  const heldElbow = continueHeldArm
    ? HumanPropFrame.relative(
        grip,
        HumanPropFrame.bone(bones.get(`${side}LowerArm`)!),
      )
    : undefined;
  const heldFingers = continueHeldArm
    ? AutoMovieMotionHumanArmAngles.angles(context.entry.pose, side).fingers
    : undefined;
  const heldReference = continueHeldArm
    ? HumanLimbFit.reference(context.entry.pose, `${side}Arm`)
    : undefined;
  const clock: IAutoMovieMotionClock = releasePlan.timetable();
  const open: number = clock.at("open");
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
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
  ) => IPlanPlacedResult = (
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
      ...(heldElbow === undefined
        ? {}
        : { heldElbow: HumanPropFrame.compose(at, heldElbow).position }),
    };
  };

  // The ordinary release solves its elbow track. A push that takes an active
  // grip carries the already displayed elbow with that same grip instead.
  const elbow: motionHumanBendTrack.ITrack | undefined = continueHeldArm
    ? undefined
    : motionHumanBendTrack({
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
      elbow?.prepare(before),
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
      const { wrist, contact, heldElbow }: ReturnType<typeof placed> = placed(
        posture,
        seconds,
        resolution,
      );
      return {
        ...posture,
        ...(heldFingers === undefined
          ? {}
          : { joints: { ...posture.joints, ...heldFingers } }),
        limbs: {
          ...posture.limbs,
          [`${side}Arm`]: {
            ...AutoMovieMotionHumanArmTarget.fromWrist(
              wrist,
              heldElbow ?? elbow!.elbow(posture, seconds, wrist),
              { ...contact },
            ),
            ...(heldReference === undefined
              ? {}
              : { reference: heldReference }),
          },
        },
      };
    },
  };
  const composed: IAutoMovieMotionHumanActionPlan = composeMotionHumanAction({
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
  const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.subtract(point(open + h), point(open - h)),
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
        throw new AutoMovieMotionHumanRefusal({
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
      return AutoMovieEngineVector3.add(
        frame.position,
        AutoMovieEngineQuaternion.rotateVector(frame.rotation, local.point),
      );
    };
    const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(place(launch.to), place(launch.from)),
    );
    launches.push({
      prop: launch.prop,
      seconds: open,
      point: frame.position,
      velocity: AutoMovieEngineVector3.add(
        velocity,
        AutoMovieEngineVector3.scale(along, launch.speed),
      ),
      rotation: frame.rotation,
    });
  }
  return { ...composed, launches };
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
  heldElbow?: IAutoMovieVector3;
};

/*
 * The alternatives of `OffsetsEntryItem`'s site.
 */
type OffsetsEntryItem = "fist" | "flat";

export namespace releasePlan {
  export function timetable(): IAutoMovieMotionClock {
    return motionClock.sequence([
      { name: "hold", seconds: motionHumanTiming.PAUSES.brief },
      { name: "open", seconds: motionHumanTiming.PAUSES.brief },
    ]);
  }
}
