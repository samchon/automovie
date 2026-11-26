import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanSignature } from "../audit/AutoMovieMotionHumanSignature";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmJointCourse } from "../compose/AutoMovieMotionHumanArmJointCourse";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { climbStairsRailLine } from "./climbStairsRailLine";

/** Allowed displayed grip residual, in metres. */
const MISS: number = 0.015;

/** Provisional bracing share of the body weight during a rail-assisted flight. */
const LOAD: number = 0.12;

/** The longest reach onto and off the rail, seconds (provisional). */
const TRANSIT: number = 0.4;

/**
 * The reach's largest share of the climb's duration, so the grip bears over at
 * least three fifths of it (provisional).
 */
const TRANSIT_SHARE: number = 0.2;

/**
 * Carry a stance hand along a fixed rail on the stair's existing clock. The
 * hand closes on the named finite bar, slides along its axis while bearing and
 * releases before the final landing stance.
 *
 * @param context The actor, its actual stair prop and chosen rail.
 * @param stairs The unchanged tread and pelvis plan.
 * @param rail The rail affordance and hand that takes it.
 * @returns The stair plan with a posed, verified rail support window.
 * @throws {HumanRefusal} If the rail is absent, moves or cannot be reached
 *   during the braced part of the flight.
 */
export function climbStairsRail(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbStairs.IParams>,
  stairs: IAutoMovieMotionHumanActionPlan,
  rail: IAutoMovieMotionHumanClimbStairs.IRail,
): IAutoMovieMotionHumanActionPlan {
  const subject: string | undefined = context.params.on;
  const refuse = (reason: string): never => {
    throw new HumanRefusal({
      kind: "affordance",
      axis: "rail.point",
      value: rail.point,
      reason,
      fix: "name a reachable fixed stair rail and stage the performer beside it",
    });
  };
  if (subject === undefined)
    return refuse("a handrail needs the flight's prop subject");
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const bar: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (affordance: IAutoMovieAffordance): boolean =>
      affordance.id === rail.point && affordance.kind === "bar",
  );
  if (
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.hasArticulations === true ||
    bar?.length === undefined ||
    !(bar.length > 0)
  )
    return refuse(subject + " has no stationary bar " + rail.point);
  const model: IAutoMovieRigidTransform = read.frame(context.start);
  const line: climbStairsRailLine.ILine | null = climbStairsRailLine(model, {
    frame: bar.frame,
    aperture: bar.aperture,
    length: bar.length,
  });
  if (line === null)
    return refuse("the selected bar does not run along the flight");
  const along: IAutoMovieVector3 = line.along;
  const normal: IAutoMovieVector3 = line.normal;
  const toPoint: (root: IAutoMovieVector3) => IAutoMovieVector3 = line.point;
  const side: AutoMovieHumanSide = rail.hand;
  const arm: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const body: IAutoMovieMotionHumanBody = context.body;
  const place: ReturnType<typeof HumanHandTarget.prepareFrame> =
    HumanHandTarget.prepareFrame(body, side, normal, {
      surface: "grip",
      shape: "relaxed",
      forward: side === "left" ? Vector3.scale(along, -1) : along,
    });
  const offset: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
  const entry: Parameters<typeof AutoMovieMotionHumanArm.carry>[2] = {
    [side]: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
  };

  const duration: number = stairs.duration;
  const transit: number = Math.min(TRANSIT, duration * TRANSIT_SHARE);
  const release: number = duration - transit;
  // The carry, solved at knots from the plan's own posture once the
  // performance is prepared.
  const carrier: AutoMovieMotionHumanArmJointCourse.ICarrier =
    AutoMovieMotionHumanArmJointCourse.carrier(body);
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds,
    channels,
    resolution,
    projection,
    evaluation,
  ): IAutoMovieMotionHumanPosture => {
    const bodyPose: IAutoMovieMotionHumanPosture = stairs.posture(
      seconds,
      channels,
      resolution,
      projection,
      evaluation,
    );
    if (
      seconds <= 0 ||
      seconds >= duration ||
      (channels !== undefined && !channels.includes(arm))
    )
      return bodyPose;
    const wrist: IAutoMovieMotionHumanHand.IWrist = place(bodyPose).place(
      toPoint(bodyPose.root),
    );
    const goal: IAutoMovieHumanLimbGoal =
      AutoMovieMotionHumanArmTarget.fromWrist(
        wrist,
        AutoMovieMotionHumanBend.arm(body, bodyPose, side, "hang"),
        offset,
      );
    const weight: number = Math.min(
      1,
      seconds / transit,
      (duration - seconds) / transit,
    );
    const gripped: IAutoMovieMotionHumanPosture = {
      ...bodyPose,
      limbs: {
        ...bodyPose.limbs,
        [arm]: weight === 1 ? { ...goal, planted: true } : goal,
      },
    };
    return carrier.carry(
      seconds,
      {
        posture: gripped,
        sides: [side],
        held: entry,
        share: minimumJerk.share(weight),
        planned: bodyPose,
      },
      resolution,
      projection,
    );
  };

  const project: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  let miss: number = 0;
  for (const t of [
    ...AutoMovieMotionHumanSignature.times(transit, release),
    release,
  ]) {
    const observed: IAutoMovieMotionHumanPosture = posture(t);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        observed,
        undefined,
        undefined,
        undefined,
        undefined,
        project,
      ).pose,
    );
    miss = Math.max(
      miss,
      Vector3.length(
        Vector3.subtract(
          HumanHand.frame(body, bones, side, "grip").point,
          toPoint(observed.root),
        ),
      ),
    );
  }
  if (miss > MISS)
    throw new HumanRefusal({
      kind: "reach",
      axis: "rail.point",
      value: rail.point,
      feasible: { kind: "range", minimum: 0, maximum: MISS, unit: "m" },
      reason:
        "the displayed grip misses " +
        rail.point +
        " by " +
        miss.toFixed(3) +
        " m",
      fix: "stage the performer nearer the named rail or choose a nearer grip",
    });
  return {
    ...stairs,
    posture,
    prepare: (): void => {
      stairs.prepare?.();
      // The grip's two transits, the stretches the arm is carried on.
      carrier.prepare(
        [
          [0, transit],
          [release, duration],
        ],
        posture,
      );
    },
    yields: stairs.yields?.filter(
      (channel) => channel !== arm && channel !== side + "Hand",
    ) ?? [
      "head",
      side === "left" ? "rightArm" : "leftArm",
      side === "left" ? "rightHand" : "leftHand",
    ],
    events: [
      ...stairs.events,
      { name: "railContact", share: transit / duration },
      { name: "railRelease", share: release / duration },
    ].sort((a, b) => a.share - b.share),
    contacts: [
      ...stairs.contacts,
      {
        part: side === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        support: { kind: "prop", subject, carries: false },
        from: transit / duration,
        to: release / duration,
        load: LOAD,
      },
    ],
  };
}
