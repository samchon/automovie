import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../../audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";
import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../../posture/internal/HumanArmTrajectoryModel";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { isHumanArmAlone } from "../../posture/internal/isHumanArmAlone";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { motionHumanArmBase } from "./motionHumanArmBase";
import { motionHumanTiming } from "./motionHumanTiming";

/*
 * Physical observations used by arm planning and target feedback: travel
 * duration, perceived goals and rigid contact sites on the actual body.
 */
export namespace AutoMovieMotionHumanArmObservation {
  /*
   * The time a reach on the joint-space blend from one arm to another takes:
   * its wrist's arc timed as a reach-to-grasp to a point by the two-factor
   * movement-time model (McIntosh, Mon-Williams and Tresilian 2018,
   * `motionHumanTiming.aimed`). The arm planner paces the reach by the
   * peak that timing gives its straight course (Flash and Hogan 1985's
   * minimum-jerk peak, `HumanArmTrajectoryModel.UNIT`), so a detour takes
   * proportionally longer.
   * Parameter body: The body.
   * Parameter posture: The posture the arm moves in.
   * Parameter side: The arm.
   * Parameter from: The arm at the start.
   * Parameter to: The arm at the end.
   * Parameter source: Optional exact FK source borrowed from this same synchronous
   * unchanged-body plan.
   * Parameter projection: Optional genuine same-body ROM metadata borrowed by the
   * actual raw-base solve.
   * Returns: Seconds.
   */
  export function reaching(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    to: IAutoMovieMotionHumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): number {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const base: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      {
        ...posture,
        limbs,
      },
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    return reachingPose(body, base, side, from, to, resolution);
  }

  /*
   * Measure the original blended-arm reach duration on an actual solved base. A
   * planner that already resolved its only planned arm's removed-goal base may
   * use that same complete pose instead of resolving it again.
   * Parameter body: The unchanged body whose rig admits every probe sample.
   * Parameter base: The actual canonical base pose; the measured arm's three joints
   * are replaced by each blend sample, while its fingers and ancestors remain
   * this base's.
   * Parameter side: The measured arm.
   * Parameter from: The original starting arm rotations.
   * Parameter to: The original ending arm rotations.
   * Parameter source: Optional exact FK source borrowed only until this measurement
   * returns or throws.
   * Parameter maximumSpeed: Optional elbow and wrist travel limit in metres per
   * second over minimum-jerk progress.
   * Returns: The transport time in seconds.
   */
  export function reachingPose(
    body: IAutoMovieMotionHumanBody,
    base: IAutoMoviePose,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    to: IAutoMovieMotionHumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    maximumSpeed?: number,
  ): number {
    // The wrist's travel timed as a reach-to-grasp to a point (McIntosh,
    // Mon-Williams and Tresilian 2018, `motionHumanTiming.aimed`);
    // the longest arc is the planner's to pace by (`longest`).
    const rate = maximumSpeed === undefined ? undefined : { peak: 0 };
    const wrist: number = arcs(body, base, side, from, to, source, rate)[1]!;
    const aimed: number = motionHumanTiming.aimed(wrist, 0);
    return maximumSpeed === undefined
      ? aimed
      : Math.max(aimed, rate!.peak / maximumSpeed);
  }

  /*
   * The longest of the elbow's, the wrist's and the middle fingertip's arcs on
   * the joint-space blend from one arm to another, read on an actual solved
   * base as `reachingPose` reads them.
   * Parameter body: The unchanged body whose rig admits every probe sample.
   * Parameter base: The actual canonical base pose.
   * Parameter side: The measured arm.
   * Parameter from: The starting arm rotations.
   * Parameter to: The ending arm rotations.
   * Parameter source: Optional exact FK source borrowed only until this measurement
   * returns or throws.
   * Returns: Metres.
   */
  export function longest(
    body: IAutoMovieMotionHumanBody,
    base: IAutoMoviePose,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    to: IAutoMovieMotionHumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): number {
    return Math.max(...arcs(body, base, side, from, to, source));
  }

  /*
   * reaching from an arm at rest to the arm a posture's solve fits for a
   * goal, with the posture's pose without that arm resolved once for both: the
   * base the arcs are measured on and, where the arm is the last limb the solve
   * fits and fits alone (`isHumanArmAlone`), the pose the goal's arm is fitted
   * on.
   * Parameter body: The body.
   * Parameter posture: The posture the arm moves in; its own goal for this arm is
   * not read.
   * Parameter side: The arm.
   * Parameter from: The arm at the start.
   * Parameter goal: The arm's goal at the end, world or attached.
   * Parameter maximumSpeed: Optional elbow and wrist travel limit in metres per
   * second during transport.
   * Returns: Seconds.
   */
  export function reachingGoal(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    goal: IAutoMovieHumanLimbGoal,
    maximumSpeed?: number,
  ): number {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const limb: ReachingGoalLimb = `${side}Arm`;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[limb];
    const base: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      {
        ...posture,
        limbs,
      },
      undefined,
      undefined,
      resolution,
    ).pose;
    const fitted: IAutoMoviePose = isHumanArmAlone(posture.limbs, side)
      ? HumanLimbFit.fit(
          body,
          base,
          limb,
          goal,
          ["left", "right"],
          undefined,
          undefined,
          resolution,
        ).pose
      : resolveHumanPosture.seeded(
          body,
          {
            ...posture,
            limbs: { ...posture.limbs, [limb]: goal },
          },
          undefined,
          undefined,
          resolution,
        ).pose;
    return reachingPose(
      body,
      base,
      side,
      from,
      AutoMovieMotionHumanArmAngles.angles(fitted, side),
      resolution,
      maximumSpeed,
    );
  }

  /*
   * How far a planned arm's goal has moved at a second of its hold since the
   * plan perceived it: the site the goal puts the hand on now (a person one
   * frame behind), less the site the plan used for that second, both on the
   * pose at the second. Zero wherever the goal has not moved since the plan.
   * Parameter body: The body.
   * Parameter carry: The arm.
   * Parameter posture: The posture so far at the second.
   * Parameter seconds: The second, on the hold.
   * Parameter source: Optional same-body FK metadata borrowed through the solve and
   * both goal callbacks.
   * Parameter projection: Optional genuine same-body ROM metadata borrowed through
   * the solve and goal callbacks.
   * Returns: The sites' difference, metres, the contact in the hand's frame,
   * and the base the arm is read against.
   */
  export function moved(
    body: IAutoMovieMotionHumanBody,
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IMovedResult {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${carry.side}Arm`];
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      {
        ...posture,
        limbs,
      },
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    const goal: IAutoMovieHumanLimbGoal = carry.goal(
      posture,
      seconds,
      resolution,
      projection,
    );
    const now: HumanArmTrajectory.ISite = site(
      body,
      pose,
      carry,
      goal,
      resolution,
    );
    const then: HumanArmTrajectory.ISite = site(
      body,
      pose,
      carry,
      aim(carry, posture, seconds, resolution, projection),
      resolution,
    );
    return {
      error: AutoMovieEngineVector3.subtract(now.point, then.point),
      contact: now.contact,
      base: {
        pose,
        others: [...(goal.clear ?? []), ...(goal.rests ?? [])],
        ...(goal.rests === undefined || goal.rests.length === 0
          ? {}
          : { rests: goal.rests }),
      },
    };
  }
  /*
   * Read the goal as the action plan perceives it at this local second.
   */
  export function aim(
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieHumanLimbGoal {
    return (carry.perceived ?? carry.goal)(
      posture,
      seconds,
      source,
      projection,
    );
  }

  /*
   * What of an arm's carry its site reads: the side, the skin distance the hand
   * keeps and the contact disc.
   */
  export type ISited = Pick<IAutoMovieMotionHumanArmPlanned.IPlanned, Sited>;

  /*
   * What the arms are read against at an instant
   * (`motionHumanArmBase`).
   */
  export const based: typeof motionHumanArmBase =
    motionHumanArmBase;

  /*
   * Convert an arm goal to its physical contact site on the actual pose.
   */
  export function site(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    carry: AutoMovieMotionHumanArmObservation.ISited,
    goal: IAutoMovieHumanLimbGoal,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): HumanArmTrajectory.ISite {
    const world: IAutoMovieHumanLimbGoal = HumanLimbFit.world(
      body,
      pose,
      `${carry.side}Arm`,
      goal,
      source === undefined || goal.on === undefined
        ? undefined
        : (): ReturnType<typeof poseBones> =>
            poseBones(
              body,
              pose,
              prepareHumanPoseResolution.read(source),
              new Set<AutoMovieHumanoidBone>([goal.on!]),
            ),
    );
    return {
      point:
        world.contact === undefined
          ? world.point
          : AutoMovieEngineVector3.add(
              world.point,
              AutoMovieEngineQuaternion.rotateVector(
                world.rotation ?? AutoMovieEngineQuaternion.identity(),
                world.contact,
              ),
            ),
      contact: world.contact ?? { x: 0, y: 0, z: 0 },
      ...(world.limits === undefined ? {} : { limits: world.limits }),
      ...(carry.skinDistance === undefined
        ? {}
        : { skinDistance: carry.skinDistance }),
      disc: carry.disc ?? AutoMovieMotionHumanAuditTangle.BUILT,
      ...(world.rotation === undefined ? {} : { rotation: world.rotation }),
    };
  }
}

/*
 * The alternatives of `Sited`'s site.
 */
type Sited = "side" | "skinDistance" | "disc";

/*
 * The record of `IMovedResult`'s site.
 */
type IMovedResult = {
  error: IAutoMovieVector3;
  contact: IAutoMovieVector3;
  base: HumanArmTrajectory.IProblem["bases"][number];
};

/*
 * The alternatives of `ReachingGoalLimb`'s site.
 */
type ReachingGoalLimb = "leftArm" | "rightArm";

/*
 * The chords an arc of the blend is measured on: a probe at most `R` from the
 * shoulder, the farthest probe's distance from it on the straight rest arm,
 * turning at most half a turn traces at most `πR`, and `N` equal chords of it
 * fall short by at most `π³R / (24 N²)`; that shortfall is held within the
 * trajectory model's tolerance (a millimetre), so `N = ⌈π √(πR / (24 ·
 * tol))⌉`.
 */
function arcSamples(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  probes: readonly AutoMovieHumanoidBone[],
): number {
  const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
  const reach: number = Math.max(
    ...probes.map((bone: AutoMovieHumanoidBone): number =>
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(body.rest.get(bone)!, shoulder)),
    ),
  );
  const tolerance: number = HumanArmTrajectoryModel.TOLERANCE / 1000;
  return Math.ceil(Math.PI * Math.sqrt((Math.PI * reach) / (24 * tolerance)));
}

/*
 * The elbow's, the wrist's and the middle fingertip's arcs on the joint-space
 * blend from one arm to another, metres, on an actual solved base
 * (`reachingPose`, `longest`).
 */
function arcs(
  body: IAutoMovieMotionHumanBody,
  base: IAutoMoviePose,
  side: AutoMovieHumanSide,
  from: IAutoMovieMotionHumanArmClearance.IArm,
  to: IAutoMovieMotionHumanArmClearance.IArm,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  rate?: { peak: number },
): number[] {
  const probes: readonly AutoMovieHumanoidBone[] = [
    `${side}LowerArm`,
    `${side}Hand`,
    `${side}MiddleDistal`,
  ];
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(probes);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(source);
  const upper: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}UpperArm`, from.upper, to.upper);
  const lower: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}LowerArm`, from.lower, to.lower);
  const hand: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}Hand`, from.hand, to.hand);
  const points = (w: number): IAutoMovieVector3[] => {
    const arm: IAutoMovieMotionHumanArmClearance.IArm = {
      upper: upper(w),
      lower: lower(w),
      hand: hand(w),
    };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      HumanArmClearance.posed(base, side, arm),
      resolution(),
      requested,
    );
    return probes.map(
      (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(bone)!.worldPosition,
    );
  };
  const length: number[] = [0, 0, 0];
  const samples: number = arcSamples(body, side, probes);
  let last: IAutoMovieVector3[] = points(0);
  for (let i: number = 1; i <= samples; ++i) {
    const time: number = i / samples;
    const next: IAutoMovieVector3[] = points(
      rate === undefined ? time : AutoMovieEngineMotionSampling.minimumJerkShare(time),
    );
    next.forEach((p: IAutoMovieVector3, j: number): void => {
      const distance: number = AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(p, last[j]!));
      length[j]! += distance;
      if (rate !== undefined && j < 2)
        rate.peak = Math.max(rate.peak, distance * samples);
    });
    last = next;
  }
  return length;
}
