import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHeadRest,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionManner,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanPerception } from "../law/HumanPerception";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingBody } from "../striking/StrikingBody";
import { headRestAim } from "./headRestAim";
import { kissBody } from "./kissBody";

/**
 * How far the hand on the partner's side slides down its thigh toward the knee,
 * metres (provisional: about a hand's length).
 */
const SLIDE: number = 0.12;

/**
 * The miss under which the head rests on the region, metres (provisional: a
 * skin contact).
 */
const NEAR: number = 0.01;

/**
 * The part of the head and neck's weight a resting head lays on the partner
 * (provisional: the other half is held by the neck's own muscles).
 */
const RESTING: number = 0.5;
/** The alternatives of `PlanAddedBone2`'s site. */
type PlanAddedBone2 = "neck" | "head";

/** The alternatives of `PlanAddedBone`'s site. */
type PlanAddedBone = "neck" | "head";

/** The alternatives of `PlanHeadRestPlanLimb`'s site. */
type PlanHeadRestPlanLimb = "leftArm" | "rightArm";

/**
 * Rest the head on a partner. The resting head's own region, the temple on the
 * side the partner's region lies unless named, is brought to the partner's
 * region. The body leans from the hips as a kiss does (`kissBody`, seated or on
 * planted feet), the neck flexes and the head bends to the side
 * (`headRestAim`): solved once against the region where the performer sees it
 * at the start, then corrected at every second against the region where it is
 * felt, a held limb's feedback delay before (`HumanPerception.HELD`, as
 * `touchHold.felt` reads a partner under the hand), so the head follows the
 * partner's shoulder as the partner breathes or turns. The head goes down in
 * the free transport time of its travel, rests the authored span on a `head`
 * window on the partner's region loaded with half the weight of the head and
 * neck segments in the body's own mass model, and comes up in the same time. A
 * region the lean, the neck and the side bend cannot bring the head to within
 * `NEAR` is refused with the miss and the angles, so a much shorter partner's
 * shoulder is out of reach standing.
 */
function planHeadRest(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadRest>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanHeadRest = context.params;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  HumanBound.least("hold", p.hold, 0, "s");
  if (p.partner === context.subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: p.partner,
      reason: "a head rests on another performer",
      fix: "name another performer as the partner",
    });
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const surface: Pick<IAutoMovieMotionHumanTarget.IPlace, "point"> =
    context.aim(
      { kind: "person", subject: p.partner, region: p.region },
      context.start,
    );
  const at: IAutoMovieVector3 = surface.point;
  const own: AutoMovieHumanoidRegion = p.own ?? side(context, at);
  // The side of the body the partner's region lies on.
  const near: AutoMovieHumanSide =
    side(context, at) === "templeLeft" ? "left" : "right";
  const stance: IAutoMovieMotionHumanRise.Stance = {
    left: {
      ankle: context.entry.feet.left.ankle,
      rotation: context.entry.feet.left.rotation,
    },
    right: {
      ankle: context.entry.feet.right.ankle,
      rotation: context.entry.feet.right.rotation,
    },
  };
  const seated: boolean = context.entry.supports.some(
    (s: IAutoMovieMotionHumanEntryState.ISupport): boolean => s.kind === "seat",
  );
  const aim: headRestAim.IAim = headRestAim.prepare(
    body,
    entry,
    stance,
    seated,
    own,
  );
  const solved: headRestAim.ISolved = aim.solve(at);
  if (solved.miss > NEAR) {
    // Where the region lies from the head's region at entry, in the performer's frame: left, up, ahead.
    const away: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -entry.yaw),
      Vector3.subtract(at, HumanTrunk.region(body, entry, own).point),
    );
    throw new HumanRefusal({
      kind: "reach",
      axis: "region",
      value: p.region,
      feasible: { kind: "range", minimum: null, maximum: NEAR, unit: "m" },
      reason: `the ${own} stays ${(solved.miss * 1000).toFixed(0)} mm from the partner's ${p.region} at a lean of ${solved.pitch.toFixed(0)} degrees forward and ${solved.roll.toFixed(0)} to the side, the neck flexed ${solved.flexion.toFixed(0)} and bent ${solved.tilt.toFixed(0)} to the side; the region lies ${(away.x * 1000).toFixed(0)} mm to the left, ${(away.y * 1000).toFixed(0)} mm up and ${(away.z * 1000).toFixed(0)} mm ahead of the ${own} at entry`,
      fix: "sit or stand nearer, or rest on a region within the lean's reach",
    });
  }
  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
    context,
    p.manner,
  );
  const approach: number = AutoMovieMotionHumanTiming.transport(
    Vector3.distance(HumanTrunk.region(body, entry, own).point, at),
  );
  const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: approach,
      attack: 0,
      hold: p.hold,
      retract: approach,
    }),
    modifiers,
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(timed.duration, [
    ...timed.instants,
    { name: "contact", seconds: timed.at("ready") },
    { name: "part", seconds: timed.at("relax") },
  ]);
  const share: (seconds: number) => number = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  const aimed: (seconds: number) => headRestAim.ISolved = following(
    context,
    p,
    aim.follow(solved),
  );
  const duration: number = clock.duration;
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, duration),
      clock,
      primitives: [
        {
          channels: ["root", "trunk"],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture =>
            kissBody(
              body,
              posture,
              stance,
              aimed(seconds),
              share(seconds),
              seated,
            ),
        },
        // The arm on the partner's side slides its hand down the thigh
        // toward the knee as the body leans, carrying that upper arm forward
        // of the partner's instead of into it.
        {
          channels: [near === "left" ? "leftArm" : "rightArm"],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture => {
            const limb: PlanHeadRestPlanLimb =
              near === "left" ? "leftArm" : "rightArm";
            const goal: IAutoMovieHumanLimbGoal | undefined =
              posture.limbs[limb];
            if (goal === undefined) return posture;
            const ahead: IAutoMovieVector3 = Vector3.scale(
              Quaternion.rotateVector(
                Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, entry.yaw),
                { x: 0, y: 0, z: 1 },
              ),
              SLIDE * share(seconds),
            );
            return {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: {
                  ...goal,
                  point: Vector3.add(goal.point, ahead),
                  bend: Vector3.add(goal.bend, ahead),
                },
              },
            };
          },
        },
        {
          channels: ["head"],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture => {
            const s: headRestAim.ISolved = aimed(seconds);
            const k: number = share(seconds);
            const flexion: IAutoMovieMotionHumanJoints.Angles =
              AutoMovieMotionHumanHead.share(0, s.flexion * k);
            const bend: IAutoMovieMotionHumanJoints.Angles =
              AutoMovieMotionHumanHead.share(1, s.tilt * k);
            const added: (
              bone: PlanAddedBone,
            ) => readonly [number, number, number] = (
              bone: PlanAddedBone2,
            ): readonly [number, number, number] => {
              const held: readonly [number, number, number] = posture.joints[
                bone
              ] ?? [0, 0, 0];
              return [
                held[0] + flexion[bone]![0],
                held[1] + bend[bone]![1],
                held[2],
              ];
            };
            return {
              ...posture,
              joints: {
                ...posture.joints,
                neck: added("neck"),
                head: added("head"),
              },
            };
          },
        },
      ],
      contact: "contact",
    });
  return {
    ...plan,
    contacts: [
      ...plan.contacts,
      {
        part: "head",
        kind: "bear",
        region: own,
        load: load(body),
        from: clock.at("ready") / duration,
        to: clock.at("relax") / duration,
        support: { kind: "person", subject: p.partner, region: p.region },
      },
    ],
  };
}

/**
 * Rest the head on a partner. The resting head's own region, the temple on the
 * side the partner's region lies unless named, is brought to the partner's
 * region. The body leans from the hips as a kiss does (`kissBody`, seated or on
 * planted feet), the neck flexes and the head bends to the side
 * (`headRestAim`): solved once against the region where the performer sees it
 * at the start, then corrected at every second against the region where it is
 * felt, a held limb's feedback delay before (`HumanPerception.HELD`, as
 * `touchHold.felt` reads a partner under the hand), so the head follows the
 * partner's shoulder as the partner breathes or turns. The head goes down in
 * the free transport time of its travel, rests the authored span on a `head`
 * window on the partner's region loaded with half the weight of the head and
 * neck segments in the body's own mass model, and comes up in the same time. A
 * region the lean, the neck and the side bend cannot bring the head to within
 * `NEAR` is refused with the miss and the angles, so a much shorter partner's
 * shoulder is out of reach standing.
 */
export const headRest: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHeadRest> =
  {
    name: "headRest",
    interrupts: AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    }),
    plan: planHeadRest,
  };

/**
 * The share of the body's weight a resting head lays on the partner: `RESTING`
 * of the head and neck segments' share of the body's own mass model.
 */
function load(body: IAutoMovieMotionHumanActionContext["body"]): number {
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const head: number = model.segments
    .filter(
      (s: IAutoMovieResolveCenterOfMass.ISegment): boolean =>
        s.bone === "head" || s.bone === "neck",
    )
    .reduce(
      (sum: number, s: IAutoMovieResolveCenterOfMass.ISegment): number =>
        sum + s.mass,
      0,
    );
  return (RESTING * head) / model.mass;
}

/**
 * The aim at each second: the plan's solution corrected onto the partner's
 * region where it is felt, a held limb's feedback delay before.
 */
function following(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadRest>,
  p: IAutoMovieMotionHumanHeadRest,
  follow: (to: IAutoMovieVector3) => headRestAim.ISolved,
): (seconds: number) => headRestAim.ISolved {
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const bone: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      partner.body.surfaces.regions[p.region].bone,
    ]);
  let last: number | undefined;
  let kept: headRestAim.ISolved | undefined;
  return (seconds: number): headRestAim.ISolved => {
    if (kept !== undefined && last === seconds) return kept;
    const felt: IAutoMovieVector3 = StrikingBody.region(
      partner.body,
      partner.bones(context.start + seconds - HumanPerception.HELD, bone),
      p.region,
    ).point;
    last = seconds;
    kept = follow(felt);
    return kept;
  };
}

/** The temple on the side of the performer the partner's region lies. */
function side(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeadRest>,
  at: IAutoMovieVector3,
): AutoMovieHumanoidRegion {
  const left: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.entry.posture.yaw),
    { x: 1, y: 0, z: 0 },
  );
  const head: IAutoMovieVector3 = HumanTrunk.region(
    context.body,
    context.entry.posture,
    "crown",
  ).point;
  return Vector3.dot(Vector3.subtract(at, head), left) >= 0
    ? "templeLeft"
    : "templeRight";
}
