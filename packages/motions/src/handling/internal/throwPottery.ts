import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanThrowPottery,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanTrunkLean } from "./HumanTrunkLean";
import { throwPotteryRise } from "./throwPotteryRise";
import { ThrowPotteryData } from "./ThrowPotteryData";

/*
 * Draw up a clay wall on a turning wheel with both hands. Register as
 * `throwPottery`.
 *
 * The right palm lies on the wall's `outside` face and the left on its `inside`
 * face, each placed by the wrist that puts the palm's surface on the face
 * (`placeHumanHandSurface`'s rule) with the hand's entry attitude. The faces
 * ride the wheel's `raise` slider, which the pull drives from its travel at the
 * start up by `rise` over `seconds`, so both palms rise with the wall and its
 * height grows monotonically; the trunk leans forward over the wheel, by the
 * least hip hinge (`HumanTrunkLean`) that brings every palm place within the
 * arms, coming in and going out with the hands; the head's crank turns at `rpm`
 * throughout. The clay is round about the head's axis, so each palm stays on
 * the same surface in the turning head's frame. The hands reach the wall over
 * the transport movement time and leave over another. Events: `strokeStart` and
 * `strokeEnd` bound the pull.
 *
 * Refusals: a wheel without its head, rise or wall faces; a rise outside the
 * wheel's; a non-positive duration; a face beyond either arm.
 */
export const throwPottery: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanThrowPottery.IParams> =
  {
    name: "throwPottery",
    interrupts: {
      any: [
        {
          window: { start: "strokeEnd", end: 1 },
          kind: "inertialize",
          entry: 0,
        },
      ],
    },
    plan,
  };

/*
 * Admit the wheel, then place both palms on the rising wall and drive it.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrowPottery.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanThrowPottery.IParams = context.params;
  if (!(p.duration > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: p.duration,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: Number.MAX_VALUE,
        unit: "s",
      },
      reason: "a pull needs a finite positive duration",
      fix: "give the pull's duration in seconds",
    });
  const wheel: IAutoMovieMotionHumanPropReader = context.prop(p.wheel);
  const site: (id: string) => IAutoMovieAffordance = (
    id: string,
  ): IAutoMovieAffordance => {
    const found: IAutoMovieAffordance | undefined =
      wheel.prop.affordances?.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
    if (found === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "wheel",
        value: p.wheel,
        feasible: null,
        reason: `${p.wheel} declares no ${id}`,
        fix: "give a wheel with a head crank, a raise slider and outside and inside faces",
      });
    return found;
  };
  site("head");
  const raise: IAutoMovieAffordance = site("raise");
  const travel: number = raise.travel ?? 0;
  const start: number = wheel.state?.(context.start)?.["raise"] ?? 0;
  const rise: number = throwPotteryRise(p.rise, travel, start);
  const frame: IAutoMovieRigidTransform = wheel.frame(context.start);
  const face: (id: string, lift: number) => IAutoMovieVector3 = (
    id: string,
    lift: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(
        frame.rotation,
        AutoMovieEngineVector3.add(site(id).frame.translation, {
          x: 0,
          y: start + lift,
          z: 0,
        }),
      ),
    );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const turn: (side: AutoMovieHumanSide) => IAutoMovieQuaternion = (
    side: AutoMovieHumanSide,
  ): IAutoMovieQuaternion => bones.get(`${side}Hand`)!.worldRotation;
  const local: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => HumanHand.offset(context.body, side, "palm").point;
  const wrist: (
    side: AutoMovieHumanSide,
    id: string,
    lift: number,
  ) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
    id: string,
    lift: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineVector3.subtract(
      face(id, lift),
      AutoMovieEngineQuaternion.rotateVector(turn(side), local(side)),
    );
  // The trunk leans over the wheel as little as brings both palms' places,
  // from the wall's start to its top, within the arms.
  const forward: number = HumanTrunkLean.least(
    context,
    ThrowPotteryData.PAIRS.flatMap((pair: ThrowPotteryData.IPair): HumanTrunkLean.IWrist[] =>
      [0, rise].map(
        (lift: number): HumanTrunkLean.IWrist => ({
          side: pair.side,
          point: wrist(pair.side, pair.face, lift),
          rotation: turn(pair.side),
        }),
      ),
    ),
  );

  const tempo: number = context.tempo ?? 1;
  const reachOf: (side: AutoMovieHumanSide, id: string) => number = (
    side: AutoMovieHumanSide,
    id: string,
  ): number =>
    AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.subtract(
        wrist(side, id, 0),
        bones.get(`${side}Hand`)!.worldPosition,
      ),
    );
  const transport: number =
    tempo *
    AutoMovieMotionHumanTiming.transport(
      Math.max(reachOf("right", "outside"), reachOf("left", "inside")),
    );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: transport,
    attack: tempo * p.duration,
    retract: transport,
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const lift: (seconds: number) => number = (seconds: number): number => {
    const u: number = Math.min(
      1,
      Math.max(0, (seconds - ready) / (done - ready)),
    );
    return rise * u * u * (3 - 2 * u);
  };
  const arm: (
    side: AutoMovieHumanSide,
    id: string,
  ) => IAutoMovieMotionHumanPrimitive = (
    side: AutoMovieHumanSide,
    id: string,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanArm.carried({
      body: context.body,
      side,
      from: 0,
      to: clock.duration,
      span: { start: 0, ready, relax: done, end: clock.duration },
      // The whole clock is the law's own, lengthened by a slower tempo.
      together: AutoMovieMotionHumanArm.together(
        context.handover,
        true,
        context.tempo,
      ),
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      weight: (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds),
      goal: (
        _posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieHumanLimbGoal => ({
        point: wrist(side, id, lift(seconds)),
        rotation: turn(side),
        contact: local(side),
        bend: AutoMovieMotionHumanBend.hang(
          context.body,
          context.entry.posture,
          side,
        ),
      }),
    });
  const under: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const base: IAutoMovieMotionHumanActionPlan = {
    ...HumanTrunkLean.moving(under, forward),
    posture: (seconds: number): IAutoMovieMotionHumanPosture =>
      HumanTrunkLean.lean(
        context.body,
        under.posture(seconds),
        forward * clock.envelope(["start", "ready"], ["relax", "end"], seconds),
      ),
  };
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [arm("right", "outside"), arm("left", "inside")],
      contact: "strokeStart",
    });
  const spin: number = ((p.rpm ?? ThrowPotteryData.RPM) * 360) / 60;
  const head: number = wheel.state?.(context.start)?.["head"] ?? 0;
  const drives: IAutoMovieMotionPropDrive[] = [
    {
      prop: p.wheel,
      articulation: "head",
      from: 0,
      to: 1,
      travel: (seconds: number): number => head + spin * seconds,
    },
    {
      prop: p.wheel,
      articulation: "raise",
      from: ready / clock.duration,
      to: done / clock.duration,
      travel: (seconds: number): number => start + lift(seconds),
    },
  ];
  return {
    ...composed,
    hands: ["right", "left"],
    drives,
    contacts: [
      ...composed.contacts,
      ...ThrowPotteryData.PAIRS.map(
        (pair: ThrowPotteryData.IPair): IAutoMovieMotionHumanContactWindow => ({
          part: pair.side === "left" ? "leftHand" : "rightHand",
          kind: "bear",
          region: pair.side === "left" ? "palmLeft" : "palmRight",
          from: ready / clock.duration,
          to: done / clock.duration,
          support: { kind: "prop", subject: p.wheel },
        }),
      ),
    ],
  };
}
