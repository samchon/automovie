import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPullCover,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { motionHumanTiming } from "../../compose/internal/motionHumanTiming";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { pullCoverWay } from "./pullCoverWay";
import { PullCoverData } from "./PullCoverData";

/*
 * Pull a cover up while lying, or push it off. Each hand's way runs over its
 * own side of the lying body, from the thigh's front over the upper abdomen to
 * the chest (`WAY`), each region `OVER` out along its normal, read on the
 * posture the body lies in at the start. Pulling, both hands go to the thigh
 * end by `ready`, grip the soft cover there (the soft prop binds its particle
 * nearest each hand's grip socket when the grip closes) and draw it up the way
 * to the chest by `strokeEnd`, where they let go and return; pushing runs the
 * way from the chest down. The hands face the body, the palms down onto the
 * cover, the fingers across the body toward its midline. Both arms are laid in
 * one course (`courseArmGoal`). A performer not lying on the back (the sternum
 * less than half the chest's depth above the upper back) is refused.
 */
export const pullCover: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPullCover> =
  {
    name: "pullCover",
    interrupts: {},
    plan: planPullCover,
  };

/*
 * Pull a cover up while lying, or push it off. Each hand's way runs over its
 * own side of the lying body, from the thigh's front over the upper abdomen to
 * the chest (`WAY`), each region `OVER` out along its normal, read on the
 * posture the body lies in at the start. Pulling, both hands go to the thigh
 * end by `ready`, grip the soft cover there (the soft prop binds its particle
 * nearest each hand's grip socket when the grip closes) and draw it up the way
 * to the chest by `strokeEnd`, where they let go and return; pushing runs the
 * way from the chest down. The hands face the body, the palms down onto the
 * cover, the fingers across the body toward its midline. Both arms are laid in
 * one course (`courseArmGoal`). A performer not lying on the back (the sternum
 * less than half the chest's depth above the upper back) is refused.
 */
function planPullCover(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPullCover>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanPullCover = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const sternum: IAutoMovieVector3 = HumanTrunk.region(
    body,
    entry,
    "sternum",
  ).point;
  const back: IAutoMovieVector3 = HumanTrunk.region(
    body,
    entry,
    "upperBack",
  ).point;
  // Lying on the back, the sternum lies a chest's depth above the upper
  // back; standing or on a side, the two are about level, and face down
  // the sternum lies below.
  if (sternum.y - back.y < body.measure.chestDepth / 2)
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: "base",
      value: context.entry.base.kind,
      feasible: { kind: "alternatives", values: ["lying on the back"] },
      reason: "a cover is drawn over a body lying on its back",
      fix: "lie down on the back first",
    });

  // Each hand's way, from where it grips to where it lets go, read on
  // the displayed entry pose: the thighs ride the legs, which a
  // trunk-only reading leaves out.
  const pose: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const ways: Record<AutoMovieHumanSide, IAutoMovieVector3[]> = {
    left: points("left"),
    right: points("right"),
  };
  function points(side: AutoMovieHumanSide): IAutoMovieVector3[] {
    const placed: IAutoMovieVector3[] = PullCoverData.WAY[side].map(
      (name: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[name];
        const bone: IAutoMovieResolvedBone = pose.get(frame.bone)!;
        return AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.add(
            bone.worldPosition,
            AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, frame.point),
          ),
          AutoMovieEngineVector3.scale(
            AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, frame.normal),
            PullCoverData.OVER,
          ),
        );
      },
    );
    return p.off === true ? placed.reverse() : placed;
  }
  const toward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(HumanTrunk.region(body, entry, "groin").point, sternum),
  );
  const up: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(sternum, back),
  );
  // Each hand's fingers point across the body toward its midline, so
  // the forearm comes in from the side, clear of the trunk, as hands
  // drawing a cover's edge hold it.
  const medial = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(sternum, ways[side][0]!);
    const level: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      across,
      AutoMovieEngineVector3.scale(up, AutoMovieEngineVector3.dot(across, up)),
    );
    return AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(
        level,
        AutoMovieEngineVector3.scale(toward, AutoMovieEngineVector3.dot(level, toward)),
      ),
    );
  };
  const target = (
    side: AutoMovieHumanSide,
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanArmTarget.ITarget =>
    AutoMovieMotionHumanArmTarget.prepareTarget(
      body,
      side,
      "grip",
      "relaxed",
    )({
      point: at,
      rotation: HumanHand.align(HumanHand.offset(body, side, "grip"), {
        normal: AutoMovieEngineVector3.scale(up, -1),
        forward: medial(side),
      }),
      bend: AutoMovieMotionHumanBend.hang(body, entry, side, 0.2),
    });
  const length = (way: readonly IAutoMovieVector3[]): number =>
    way
      .slice(1)
      .reduce(
        (sum: number, q: IAutoMovieVector3, i: number): number =>
          sum + AutoMovieEngineVector3.distance(way[i]!, q),
        0,
      );

  const frame: IAutoMovieMotionHumanFrame = {
    origin: entry.root,
    yaw: entry.yaw,
  };
  const origins: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmTarget.IOrigin
  > = {
    left: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "left",
      "grip",
    ),
    right: AutoMovieMotionHumanArmTarget.origin(
      body,
      pose,
      frame,
      "right",
      "grip",
    ),
  };
  const reach = (side: AutoMovieHumanSide, at: IAutoMovieVector3): number =>
    AutoMovieEngineVector3.distance(
      AutoMovieMotionHumanArmTarget.point(entry, origins[side]),
      at,
    );
  const clock: IAutoMovieMotionClock = motionClock.phrase({
    prepare: motionHumanTiming.transport(
      Math.max(reach("left", ways.left[0]!), reach("right", ways.right[0]!)),
    ),
    attack: motionHumanTiming.transport(
      Math.max(length(ways.left), length(ways.right)),
    ),
    hold: motionHumanTiming.seconds("beat"),
    retract: motionHumanTiming.transport(
      Math.max(
        reach("left", ways.left.at(-1)!),
        reach("right", ways.right.at(-1)!),
      ),
    ),
  });
  const stroke = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPrimitive => ({
    ...AutoMovieMotionHumanArmPhrase.stroke({
      body,
      clock,
      side,
      origin: origins[side],
      path: (
        _posture: IAutoMovieMotionHumanPosture,
        _seconds: number,
        progress: number,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        target(side, pullCoverWay(ways[side], progress)),
    }),
    reads: ["root", `${side}Arm`, `${side}Hand`],
  });
  const plan: IAutoMovieMotionHumanActionPlan =
    composeMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [stroke("left"), stroke("right")],
      contact: "strokeEnd",
    });
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan,
    side: "left",
    span: {
      start: 0,
      ready: clock.at("ready"),
      relax: clock.at("relax"),
      end: clock.duration,
    },
    with: [
      {
        side: "right",
      },
    ],
  });
  const from: number = clock.at("ready") / clock.duration;
  const to: number = clock.at("strokeEnd") / clock.duration;
  return {
    ...coursed,
    contacts: [
      ...coursed.contacts,
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: side === "left" ? "leftHand" : "rightHand",
          kind: "grip",
          from,
          to,
          support: { kind: "prop", subject: p.prop },
        }),
      ),
    ],
  };
}
