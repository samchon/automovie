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
import { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";
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

/**
 * Physical observations used by arm planning and target feedback: travel
 * duration, perceived goals and rigid contact sites on the actual body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents reach arcs, target displacement and goal-to-site frame conversion at action-local seconds.
 * @evidence contracts/development/design.md#principled-representation Each reading uses canonical body poses and world-metre goal frames; speed and contact geometry keep their existing physical owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The planner and feedback reader share the same site/perception conversion; duration reads the same solved arm probes without owning trajectory optimization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The arc's chord count derived from the arm and the model's tolerance, the reach's movement-time source, goal ownership and contact offsets are preserved; no action or body receives a special path.
 */
export namespace AutoMovieMotionHumanArmObservation {
  /**
   * The time a reach on the joint-space blend from one arm to another
   * takes: its wrist's arc timed as a reach-to-grasp to a point by the
   * two-factor movement-time model (McIntosh, Mon-Williams and Tresilian
   * 2018, `AutoMovieMotionHumanTiming.aimed`). The arm planner paces the
   * reach by the peak that timing gives its straight course (Flash and
   * Hogan 1985's minimum-jerk peak, `HumanArmTrajectoryModel.UNIT`), so a
   * detour takes proportionally longer.
   *
   * @param body The body.
   * @param posture The posture the arm moves in.
   * @param side The arm.
   * @param from The arm at the start.
   * @param to The arm at the end.
   * @param source Optional exact FK source borrowed from this same synchronous unchanged-body plan.
   * @param projection Optional genuine same-body ROM metadata borrowed by the actual raw-base solve.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the timing, its source and the arc it reads.
   * @evidence contracts/development/implementation.md#principled-implementation The two-factor reach-to-grasp movement time of the wrist's arc on the blend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base pose, the arcs sampled along the blend, one movement-time reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is measured on the blend the arm takes, not on the straight line between the ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original base solve and N+1 actual blended poses, N the chords that hold an arm-length half-turn's shortfall within a millimetre, retain their original arc integration. Each FK read admits every authored joint but resolves only the three probes and their ancestors; one operation reader shares unchanged scalar FK prerequisites. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses blendHumanJoint, HumanArmClearance.posed and poseBones. The actual removed-arm raw posture receives ordinary native admission/fitting; one local FK reader shares only fixed joint/rest/ancestor prerequisites across actual blend samples.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The base pose, three probe names and local exact FK reader live only through this synchronous measurement. Only the prior probe points and three accumulated arc lengths survive between samples; no blend-pose history, reader or callback enters the returned scalar.
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
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const base: IAutoMoviePose = resolveHumanPosture.seeded(body, {
      ...posture,
      limbs,
    }, undefined, undefined, resolution, undefined, projection).pose;
    return reachingPose(body, base, side, from, to, resolution);
  }

  /**
   * Measure the original blended-arm reach duration on an actual solved base.
   * A planner that already resolved its only planned arm's removed-goal base
   * may use that same complete pose instead of resolving it again.
   *
   * @param body The unchanged body whose rig admits every probe sample.
   * @param base The actual canonical base pose; the measured arm's three joints are replaced by each blend sample, while its fingers and ancestors remain this base's.
   * @param side The measured arm.
   * @param from The original starting arm rotations.
   * @param to The original ending arm rotations.
   * @param source Optional exact FK source borrowed only until this measurement returns or throws.
   * @returns The reach-to-grasp movement time in seconds of this base's actual wrist arc.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the supplied actual base, replaced arm joints, preserved finger/ancestor dependencies and second-valued duration.
   * @evidence contracts/development/implementation.md#principled-implementation The three arm joints are replaced at every sample; all remaining FK dependencies come from the supplied solved base. N+1 samples measure its actual elbow, wrist and fingertip arcs, and the two-factor reach-to-grasp model times the wrist's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure reaching owns raw-posture admission/resolution, this companion owns identical probe integration, and the existing single-arm planner supplies its already completed exact removed-arm base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sample, blend, arc increment or tolerance changes. Multiarm planner bases still use the original raw resolver because removing both arms differs from removing only the measured arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each query keeps N+1 actual probe blends/FK admissions and original integration; a valid existing canonical base avoids one duplicate solve. Three fixed-pair blenders prepare endpoint rotation/chart data once at first interior use, while every original share and clinical readback remain actual. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The single-arm planner's at(t).pose resolved exactly the same body/posture after removing that sole arm goal; its body and raw posture stay unchanged during this synchronous planning query. An explicit same-body operation may lend exact FK metadata from native base/endpoint solves to every original probe. Cold reaching still resolves its actual raw base normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the caller's completed base and optional exact FK source only until the scalar returns, with a local getter, prior probe array and three accumulated lengths. No new time/pose history or numerical result is retained, and no source enters the scalar result.
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
    return AutoMovieMotionHumanTiming.aimed(arcs(body, base, side, from, to, source)[1]!, 0);
  }

  /**
   * The longest of the elbow's, the wrist's and the middle fingertip's arcs
   * on the joint-space blend from one arm to another, read on an actual
   * solved base as `reachingPose` reads them.
   *
   * @param body The unchanged body whose rig admits every probe sample.
   * @param base The actual canonical base pose.
   * @param side The measured arm.
   * @param from The starting arm rotations.
   * @param to The ending arm rotations.
   * @param source Optional exact FK source borrowed only until this measurement returns or throws.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the arcs read and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The same blended probe samples `reachingPose` integrates, their longest arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One blend sampling and one maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is the blend's, not the chord between the ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms N+1 blended poses with the three probes' FK, as `reachingPose`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the blenders and FK reads `reachingPose` uses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the scalar.
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
   * {@link reaching} from an arm at rest to the arm a posture's solve fits
   * for a goal, with the posture's pose without that arm resolved once for
   * both: the base the arcs are measured on and, where the arm is the last
   * limb the solve fits and fits alone (`isHumanArmAlone`), the pose the
   * goal's arm is fitted on.
   *
   * @param body The body.
   * @param posture The posture the arm moves in; its own goal for this arm is not read.
   * @param side The arm.
   * @param from The arm at the start.
   * @param goal The arm's goal at the end, world or attached.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the one base and when the end's arm is fitted on it.
   * @evidence contracts/development/implementation.md#principled-implementation The posture's solve fits the legs first and this arm last, so under `isHumanArmAlone` the arm fitted alone on the pose without it is the arm the solve gives; otherwise the posture is solved with the goal as before.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base, one end arm, then `reachingPose`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture whose other limbs couple with the arm keeps the whole solve; no arc sample or bound changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve without the arm and one arm fit, where the caller's own posture solve with the goal and `reaching`'s base made two posture solves; then `reachingPose`'s samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The base is the pose `reaching` resolves from the same posture with the same arm left out, shared by the end's fit and the arcs within this call; one exact FK reader serves all three.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The base, the fitted pose and the reader end with the call; only the scalar escapes.
   */
  export function reachingGoal(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    from: IAutoMovieMotionHumanArmClearance.IArm,
    goal: IAutoMovieHumanLimbGoal,
  ): number {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[limb];
    const base: IAutoMoviePose = resolveHumanPosture.seeded(body, {
      ...posture,
      limbs,
    }, undefined, undefined, resolution).pose;
    const fitted: IAutoMoviePose = isHumanArmAlone(posture.limbs, side)
      ? HumanLimbFit.fit(body, base, limb, goal, ["left", "right"],
          undefined, undefined, resolution).pose
      : resolveHumanPosture.seeded(body, {
          ...posture,
          limbs: { ...posture.limbs, [limb]: goal },
        }, undefined, undefined, resolution).pose;
    return reachingPose(body, base, side, from,
      AutoMovieMotionHumanArmAngles.angles(fitted, side), resolution);
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
   * @param source Optional same-body FK metadata borrowed through the solve and both goal callbacks.
   * @param projection Optional genuine same-body ROM metadata borrowed through the solve and goal callbacks.
   * @returns The sites' difference, metres, the contact in the hand's frame, and the base the arm is read against.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two sites, the pose they are read on and when the result is zero.
   * @evidence contracts/development/implementation.md#principled-implementation A feedback term is driven by error: the target's motion since the feed-forward plan perceived it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base pose, two goal reads, one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both sites are read on the same pose, so the posture so far cancels and only the target's motion is left.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolve and two goal reads per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Native removed-arm placement and both current/perceived attached-site observations share one exact local FK getter. Every actual goal callback, world attachment transform and target difference still runs; no fitted pose/site result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The invocation owns its lazy exact reader until return/throw; the returned error/contact/base keeps original numerical payloads and no reader, callback or operation history.
   */
  export function moved(
    body: IAutoMovieMotionHumanBody,
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): {
    error: IAutoMovieVector3;
    contact: IAutoMovieVector3;
    base: HumanArmTrajectory.IProblem["bases"][number];
  } {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${carry.side}Arm`];
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(body, {
      ...posture,
      limbs,
    }, undefined, undefined, resolution, undefined, projection).pose;
    const goal: IAutoMovieHumanLimbGoal = carry.goal(posture, seconds, resolution, projection);
    const now: HumanArmTrajectory.ISite = site(body, pose, carry, goal, resolution);
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
        ...(goal.rests === undefined || goal.rests.length === 0 ? {} : { rests: goal.rests }),
      },
    };
  }
  /**
   * Read the goal as the action plan perceives it at this local second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines perceived callback precedence and forwards the actual posture/local seconds plus optional same-body FK/genuine ROM metadata for this synchronous invocation only.
   * @evidence contracts/development/implementation.md#principled-implementation The carry explicitly supplies a perceived goal for planning; when absent its ordinary actual goal defines the same target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional callback selection and one invocation share this rule between planner and feedback observation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No returned goal, reaction time or posture is altered and no callback result is cached here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant dispatch plus the actual supplied target's work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The parent may lend same-body FK and genuine ROM metadata to the actual callback; no callback result, pose or query history is shared.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns the callback's original goal ownership.
   */
  export function aim(
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieHumanLimbGoal {
    return (carry.perceived ?? carry.goal)(posture, seconds, source, projection);
  }

  /**
   * Convert an arm goal to its physical contact site on the actual pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre goal seating, end-frame contact offset, optional orientation/task limits and the carry's disc clearance.
   * @evidence contracts/development/implementation.md#principled-implementation resolveHumanPosture.world seats attached goals first; the goal's end rotation then carries its end-local contact offset from wrist to world contact point, with identity when rotation is absent, as in the original site rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared attached-goal conversion and one site record serve trajectory planning and feedback comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original contact, limit, disc and orientation fields remain; no wrist-origin approximation substitutes for a declared contact pivot.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant rigid-frame arithmetic plus any actual attached-goal FK required by the shared resolver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Planning and feedback use the same conversion; a same-body parent may lend exact FK metadata for the actual on-bone's demanded ancestry. Different poses/goals still run their original attachment conversion, with no site cache or eager FK for world goals.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The fresh site borrows unchanged goal payloads and retains no operation reader, body cache or handle.
   */
  export function site(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    carry: IAutoMovieMotionHumanArmPlanned.IPlanned,
    goal: IAutoMovieHumanLimbGoal,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): HumanArmTrajectory.ISite {
    const world: IAutoMovieHumanLimbGoal = resolveHumanPosture.world(
      body,
      pose,
      `${carry.side}Arm`,
      goal,
      source === undefined || goal.on === undefined ? undefined :
        (): ReturnType<typeof poseBones> => poseBones(body, pose,
          prepareHumanPoseResolution.read(source), new Set<AutoMovieHumanoidBone>([goal.on!])),
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
      ...(carry.skinDistance === undefined ? {} : { skinDistance: carry.skinDistance }),
      disc: carry.disc ?? AutoMovieMotionHumanAuditTangle.BUILT,
      ...(world.rotation === undefined ? {} : { rotation: world.rotation }),
    };
  }
}

/**
 * The chords an arc of the blend is measured on: a probe at most `R` from
 * the shoulder, the farthest probe's distance from it on the straight rest
 * arm, turning at most half a turn traces at most `πR`, and `N` equal chords
 * of it fall short by at most `π³R / (24 N²)`; that shortfall is held within
 * the trajectory model's tolerance (a millimetre), so
 * `N = ⌈π √(πR / (24 · tol))⌉`.
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

/** The elbow's, the wrist's and the middle fingertip's arcs on the joint-space blend from one arm to another, metres, on an actual solved base (`reachingPose`, `longest`). */
function arcs(
  body: IAutoMovieMotionHumanBody,
  base: IAutoMoviePose,
  side: AutoMovieHumanSide,
  from: IAutoMovieMotionHumanArmClearance.IArm,
  to: IAutoMovieMotionHumanArmClearance.IArm,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
): number[] {
  const probes: readonly AutoMovieHumanoidBone[] = [
    `${side}LowerArm`, `${side}Hand`, `${side}MiddleDistal`,
  ];
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(probes);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
  const upper: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}UpperArm`, from.upper, to.upper);
  const lower: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}LowerArm`, from.lower, to.lower);
  const hand: ReturnType<typeof blendHumanJoint.between> =
    blendHumanJoint.between(body, `${side}Hand`, from.hand, to.hand);
  const points = (w: number): IAutoMovieVector3[] => {
    const arm: IAutoMovieMotionHumanArmClearance.IArm = {
      upper: upper(w), lower: lower(w), hand: hand(w),
    };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, HumanArmClearance.posed(base, side, arm), resolution(), requested);
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

