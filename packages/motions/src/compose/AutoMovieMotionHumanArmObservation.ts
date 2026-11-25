import { Quaternion, Vector3 } from "@automovie/engine";
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

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { isHumanArmAlone } from "../posture/isHumanArmAlone";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmBase } from "./AutoMovieMotionHumanArmBase";
import { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";

/** The alternatives of `Sited`'s site. */
type Sited = "side" | "skinDistance" | "disc";

/** The record of `IMovedResult`'s site. */
type IMovedResult = {
  error: IAutoMovieVector3;
  contact: IAutoMovieVector3;
  base: HumanArmTrajectory.IProblem["bases"][number];
};

/** The alternatives of `ReachingGoalLimb`'s site. */
type ReachingGoalLimb = "leftArm" | "rightArm";

/**
 * Physical observations used by arm planning and target feedback: travel
 * duration, perceived goals and rigid contact sites on the actual body.
 */
export namespace AutoMovieMotionHumanArmObservation {
  /**
   * The time a reach on the joint-space blend from one arm to another takes:
   * its wrist's arc timed as a reach-to-grasp to a point by the two-factor
   * movement-time model (McIntosh, Mon-Williams and Tresilian 2018,
   * `AutoMovieMotionHumanTiming.aimed`). The arm planner paces the reach by the
   * peak that timing gives its straight course (Flash and Hogan 1985's
   * minimum-jerk peak, `HumanArmTrajectoryModel.UNIT`), so a detour takes
   * proportionally longer.
   *
   * @param body The body.
   * @param posture The posture the arm moves in.
   * @param side The arm.
   * @param from The arm at the start.
   * @param to The arm at the end.
   * @param source Optional exact FK source borrowed from this same synchronous
   *   unchanged-body plan.
   * @param projection Optional genuine same-body ROM metadata borrowed by the
   *   actual raw-base solve.
   * @returns Seconds.
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

  /**
   * Measure the original blended-arm reach duration on an actual solved base. A
   * planner that already resolved its only planned arm's removed-goal base may
   * use that same complete pose instead of resolving it again.
   *
   * @param body The unchanged body whose rig admits every probe sample.
   * @param base The actual canonical base pose; the measured arm's three joints
   *   are replaced by each blend sample, while its fingers and ancestors remain
   *   this base's.
   * @param side The measured arm.
   * @param from The original starting arm rotations.
   * @param to The original ending arm rotations.
   * @param source Optional exact FK source borrowed only until this measurement
   *   returns or throws.
   * @returns The reach-to-grasp movement time in seconds of this base's actual
   *   wrist arc.
   */
  export function reachingPose(
    body: IAutoMovieMotionHumanBody,
    base: IAutoMoviePose,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    to: IAutoMovieMotionHumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): number {
    // The wrist's travel timed as a reach-to-grasp to a point (McIntosh,
    // Mon-Williams and Tresilian 2018, `AutoMovieMotionHumanTiming.aimed`);
    // the longest arc is the planner's to pace by (`longest`).
    return AutoMovieMotionHumanTiming.aimed(
      arcs(body, base, side, from, to, source)[1]!,
      0,
    );
  }

  /**
   * The longest of the elbow's, the wrist's and the middle fingertip's arcs on
   * the joint-space blend from one arm to another, read on an actual solved
   * base as `reachingPose` reads them.
   *
   * @param body The unchanged body whose rig admits every probe sample.
   * @param base The actual canonical base pose.
   * @param side The measured arm.
   * @param from The starting arm rotations.
   * @param to The ending arm rotations.
   * @param source Optional exact FK source borrowed only until this measurement
   *   returns or throws.
   * @returns Metres.
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

  /**
   * {@link reaching} from an arm at rest to the arm a posture's solve fits for a
   * goal, with the posture's pose without that arm resolved once for both: the
   * base the arcs are measured on and, where the arm is the last limb the solve
   * fits and fits alone (`isHumanArmAlone`), the pose the goal's arm is fitted
   * on.
   *
   * @param body The body.
   * @param posture The posture the arm moves in; its own goal for this arm is
   *   not read.
   * @param side The arm.
   * @param from The arm at the start.
   * @param goal The arm's goal at the end, world or attached.
   * @returns Seconds.
   */
  export function reachingGoal(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    goal: IAutoMovieHumanLimbGoal,
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
    );
  }

  /**
   * How far a planned arm's goal has moved at a second of its hold since the
   * plan perceived it: the site the goal puts the hand on now (a person one
   * frame behind), less the site the plan used for that second, both on the
   * pose at the second. Zero wherever the goal has not moved since the plan.
   *
   * @param body The body.
   * @param carry The arm.
   * @param posture The posture so far at the second.
   * @param seconds The second, on the hold.
   * @param source Optional same-body FK metadata borrowed through the solve and
   *   both goal callbacks.
   * @param projection Optional genuine same-body ROM metadata borrowed through
   *   the solve and goal callbacks.
   * @returns The sites' difference, metres, the contact in the hand's frame,
   *   and the base the arm is read against.
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
      error: Vector3.subtract(now.point, then.point),
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
  /** Read the goal as the action plan perceives it at this local second. */
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

  /**
   * What of an arm's carry its site reads: the side, the skin distance the hand
   * keeps and the contact disc.
   */
  export type ISited = Pick<IAutoMovieMotionHumanArmPlanned.IPlanned, Sited>;

  /**
   * What the arms are read against at an instant
   * (`AutoMovieMotionHumanArmBase`).
   */
  export const based: typeof AutoMovieMotionHumanArmBase =
    AutoMovieMotionHumanArmBase;

  /** Convert an arm goal to its physical contact site on the actual pose. */
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
          : Vector3.add(
              world.point,
              Quaternion.rotateVector(
                world.rotation ?? Quaternion.identity(),
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

/**
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
      Vector3.length(Vector3.subtract(body.rest.get(bone)!, shoulder)),
    ),
  );
  const tolerance: number = HumanArmTrajectoryModel.TOLERANCE / 1000;
  return Math.ceil(Math.PI * Math.sqrt((Math.PI * reach) / (24 * tolerance)));
}

/**
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
    const next: IAutoMovieVector3[] = points(i / samples);
    next.forEach((p: IAutoMovieVector3, j: number): void => {
      length[j]! += Vector3.length(Vector3.subtract(p, last[j]!));
    });
    last = next;
  }
  return length;
}
