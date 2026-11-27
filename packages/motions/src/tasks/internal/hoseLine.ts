import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { workHeldPush } from "../../handling/internal/workHeldPush";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { hoseBackup } from "./hoseBackup";
import { hoseLineReaction } from "./hoseLineReaction";

/*
 * The stream's sweep, degrees in all: provisional.
 */
const SPAN: number = 30;

/*
 * One member of a two-member hose team holding a charged line against its
 * nozzle reaction. Register as `hoseLine`.
 *
 * The nozzle operator holds the line by its `nozzle` grip (taken up before);
 * the free hand swings the nozzle's `bail` open and keeps it there
 * (`workHeldPush`), while the holding wrist turns the stream's `tip` onto the
 * target and sweeps it side to side, as `extinguish` sweeps its horn. The
 * backup member, behind, grips the line at their `grip` with both hands without
 * carrying it, each a power grip from above sharing the grip's length, the hand
 * reaching across the body ahead: the hands follow that grip where the
 * operator's hold puts the line at each second. The line bends at the
 * operator's hold (its `flex`) against the sweep, so the run behind the nozzle
 * stays put and the backup's grip barely moves. Both members lean into the
 * reaction: the stream pushes the line back with `hoseLineReaction.REACTION`
 * newtons, which the team shares, so each member's trunk tips forward by
 * `atan(REACTION / 2 / (m g))` over the feet, the lean that brings the body's
 * weight to balance its share. `advance` is walked by the team before
 * (`AutoMovieMotionHumanFirefighting.hoseTeam`); here the members stand.
 * Events: `strokeStart` as the stream opens, `strokeEnd` as it shuts.
 *
 * Refusals: an operator without a target or not holding the line, a line
 * without the named grip, bail or tip, and a grip beyond the arm.
 */
export const hoseLine: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFirefight.IHoseLine> =
  {
    name: "hoseLine",
    interrupts: {
      any: [{ window: { start: "strokeEnd", end: 1 }, kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/*
 * Plan the member's role.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanFirefight.IHoseLine = context.params;
  const stand: hoseLineReaction.IStand = hoseLineReaction(
    context.body.profile.mass,
    p.sweeps,
    context.tempo ?? 1,
  );
  const sweeps: number = stand.sweeps;
  const clock: IAutoMovieMotionClock = stand.clock;
  const lean: number = stand.lean;
  const under: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const base: IAutoMovieMotionHumanActionPlan = {
    ...under,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = under.posture(seconds);
      const w: number = clock.envelope(
        ["start", "ready"],
        ["relax", "end"],
        seconds,
      );
      const spine: readonly [number, number, number] = posture.joints.spine ?? [
        0, 0, 0,
      ];
      return {
        ...posture,
        joints: {
          ...posture.joints,
          spine: [spine[0] + lean * w, spine[1], spine[2]],
        },
      };
    },
  };
  return p.role === "nozzle"
    ? nozzle(context, p, clock, base, sweeps)
    : hoseBackup(context, p, clock, base);
}

/*
 * The operator: the bail open by the free hand, the stream swept by the holding
 * wrist.
 */
function nozzle(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
  p: IAutoMovieMotionHumanFirefight.IHoseLine,
  clock: IAutoMovieMotionClock,
  base: IAutoMovieMotionHumanActionPlan,
  sweeps: number,
): IAutoMovieMotionHumanActionPlan {
  if (p.target === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "target",
      value: "absent",
      feasible: null,
      reason: "the nozzle operator aims the stream at a target",
      fix: "give the target the stream sweeps",
    });
  const side: AutoMovieHumanSide =
    context.entry.holds.left === p.prop ? "left" : "right";
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.prop,
  );
  const tip: IAutoMovieAffordance | undefined = held.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "tip",
  );
  const bail: IAutoMovieAffordance | undefined = held.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "bail",
  );
  if (tip === undefined || bail === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: p.prop,
      feasible: null,
      reason: `${p.prop} declares no nozzle tip and bail`,
      fix: "hold a hose line whose nozzle declares `tip` and `bail`",
    });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const open: number = bail.travel ?? 0;
  // The bail swings open as the stroke starts and stays open to its end.
  const drives: IAutoMovieMotionPropDrive[] = [
    {
      prop: p.prop,
      articulation: "bail",
      from: 0,
      to: 1,
      travel: (seconds: number): number => {
        const u: number = Math.min(
          1,
          Math.max(
            0,
            (seconds - (ready - hoseLineReaction.SET / 2)) /
              (hoseLineReaction.SET / 2),
          ),
        );
        const v: number = Math.min(
          1,
          Math.max(0, (seconds - done) / (hoseLineReaction.SET / 2)),
        );
        return open * (u * u * (3 - 2 * u)) * (1 - v * v * (3 - 2 * v));
      },
    },
    // The line bends at the hold against the aim and the sweep, so the run
    // behind the nozzle, and the backup's grip on it, keeps its place: the
    // bend turns back the aim's heading and the sweep, and tips back its
    // pitch, as the hold carries them in.
    ...(held.affordances.some(
      (a: IAutoMovieAffordance): boolean => a.id === "flexPitch",
    )
      ? [
          {
            prop: p.prop,
            articulation: "flex",
            from: 0,
            to: 1,
            travel: (seconds: number): number =>
              -(heading * reached(seconds) + sweep(seconds)),
          },
          {
            prop: p.prop,
            articulation: "flexPitch",
            from: 0,
            to: 1,
            travel: (seconds: number): number => tilt * reached(seconds),
          },
        ]
      : []),
  ];
  const push: workHeldPush.IPush = workHeldPush(
    context,
    p.prop,
    "bailTip",
    side,
    [{ articulation: "bail", to: open }],
  );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const frame: IAutoMovieRigidTransform = context
    .prop(p.prop)
    .frame(context.entry.seconds);
  const outlet: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, tip.frame.translation),
  );
  const stream: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, tip.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const at: IAutoMovieVector3 = context.aim(p.target, context.start).point;
  const aimed: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      AutoMovieEngineMath.rotationBetween(stream, Vector3.subtract(at, outlet)),
      hand.worldRotation,
    ),
  );
  // The stream's heading off the aim at a second: side to side over the sweeps.
  const sweep: (seconds: number) => number = (seconds: number): number => {
    const u: number = Math.min(
      1,
      Math.max(0, (seconds - ready) / (done - ready)),
    );
    return (SPAN / 2) * Math.sin(2 * Math.PI * sweeps * u);
  };
  // The aim's heading and pitch, degrees, as the line turns from its
  // stream at entry to the target, and how far the hold has carried it in.
  const toward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(at, outlet),
  );
  const along: IAutoMovieVector3 = Vector3.normalize(stream);
  const heading: number =
    ((Math.atan2(toward.x, toward.z) - Math.atan2(along.x, along.z)) * 180) /
    Math.PI;
  const tilt: number =
    ((Math.asin(Math.max(-1, Math.min(1, toward.y))) -
      Math.asin(Math.max(-1, Math.min(1, along.y)))) *
      180) /
    Math.PI;
  const reached: (seconds: number) => number = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
  );
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
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
    ): IAutoMovieHumanLimbGoal => {
      return {
        point: hand.worldPosition,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, sweep(seconds)),
            aimed,
          ),
        ),
        bend,
      };
    },
  });
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: {
        ...base,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = base.posture(seconds);
          return { ...posture, joints: { ...posture.joints, ...kept.fingers } };
        },
      },
      clock,
      primitives: [arm, push.arm(clock, drives)],
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: [side, push.side],
    contacts: [
      ...composed.contacts,
      AutoMovieMotionHumanHeld.grip(held),
      push.contact(clock),
    ],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
    drives,
  };
}
