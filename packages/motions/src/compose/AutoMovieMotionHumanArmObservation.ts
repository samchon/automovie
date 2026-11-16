import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryModel } from "../posture/HumanArmTrajectoryModel";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * Physical observations used by arm planning and target feedback: travel
 * duration, perceived goals and rigid contact sites on the actual body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents reach arcs, target displacement and goal-to-site frame conversion at action-local seconds.
 * @evidence contracts/development/design.md#principled-representation Each reading uses canonical body poses and world-metre goal frames; speed and contact geometry keep their existing physical owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The planner and feedback reader share the same site/perception conversion; duration reads the same solved arm probes without owning trajectory optimization.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The original arc sampling count, speed bound, goal ownership and contact offsets are preserved; no action or body receives a special path.
 */
export namespace AutoMovieMotionHumanArmObservation {
  /**
   * The shortest reach that keeps an arm within the audit's travel bound
   * (`HumanArmTrajectoryModel.SPEED_LIMIT`) on the joint-space blend from one
   * arm to another: a minimum-jerk reach peaks at 1.875 times its mean speed
   * (Flash and Hogan 1985, J Neurosci 5:1688), so a path of length L takes
   * at least 1.875 L over the bound, L the longest of the elbow's, the
   * wrist's and the middle fingertip's arcs.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the bound, its source and the arcs it reads.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum-jerk profile's peak-to-mean speed ratio over the longest arc of the blend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One base pose, the arcs sampled along the blend, one division.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is measured on the blend the arm takes, not on the straight line between the ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original base solve and ARC+1 actual blended poses retain their original arc integration. Each FK read admits every authored joint but resolves only the three probes and their ancestors; one operation reader shares unchanged scalar FK prerequisites. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses blendHumanJoint, HumanArmClearance.posed and poseBones. Issued source provenance survives removal of the measured arm's raw goal only for the resolver's exact free-leg revalidation; one local FK reader shares fixed joint/rest/ancestor scalar work across actual blend samples.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The base pose, three probe names and local exact FK reader live only through this synchronous measurement. Only the prior probe points and three accumulated arc lengths survive between samples; no blend-pose history, reader or callback enters the returned scalar.
   */
  export function reaching(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    from: HumanArmClearance.IArm,
    to: HumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): number {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    const base: IAutoMoviePose = resolveHumanPosture.seeded(body, resolveHumanPosture.rebased(posture, {
      ...posture,
      limbs,
    }), undefined, undefined, resolution, undefined, projection).pose;
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
   * @returns The same speed-bound duration in seconds for this base's actual probe arcs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the supplied actual base, replaced arm joints, preserved finger/ancestor dependencies and second-valued duration.
   * @evidence contracts/development/implementation.md#principled-implementation The three arm joints are replaced at every sample; all remaining FK dependencies come from the supplied solved base. The original ARC samples and minimum-jerk peak/mean speed factor measure its actual elbow, wrist and fingertip arcs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure reaching owns raw-posture admission/resolution, this companion owns identical probe integration, and the existing single-arm planner supplies its already completed exact removed-arm base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sample, blend, arc increment, speed bound or tolerance changes. Multiarm planner bases still use the original raw resolver because removing both arms differs from removing only the measured arm.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each query keeps ARC+1 actual probe blends/FK admissions and original integration; a valid existing canonical base avoids one duplicate solve. Three fixed-pair blenders prepare endpoint rotation/chart data once at first interior use, while every original share and clinical readback remain actual. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The single-arm planner's at(t).pose resolved exactly the same body/posture after removing that sole arm goal; its body and raw posture stay unchanged during this synchronous planning query. An explicit same-body operation may lend exact FK metadata from native base/endpoint solves to every original probe. Cold reaching still resolves its actual raw base normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the caller's completed base and optional exact FK source only until the scalar returns, with a local getter, prior probe array and three accumulated lengths. No new time/pose history or numerical result is retained, and no source enters the scalar result.
   */
  export function reachingPose(
    body: IHumanBody,
    base: IAutoMoviePose,
    side: HumanHand.Side,
    from: HumanArmClearance.IArm,
    to: HumanArmClearance.IArm,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): number {
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
      const arm: HumanArmClearance.IArm = {
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
    let last: IAutoMovieVector3[] = points(0);
    for (let i: number = 1; i <= ARC; ++i) {
      const next: IAutoMovieVector3[] = points(i / ARC);
      next.forEach((p: IAutoMovieVector3, j: number): void => {
        length[j]! += Vector3.length(Vector3.subtract(p, last[j]!));
      });
      last = next;
    }
    return (1.875 * Math.max(...length)) / HumanArmTrajectoryModel.SPEED_LIMIT;
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
    body: IHumanBody,
    carry: AutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): {
    error: IAutoMovieVector3;
    contact: IAutoMovieVector3;
    base: HumanArmTrajectory.IProblem["bases"][number];
  } {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${carry.side}Arm`];
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(body, resolveHumanPosture.rebased(posture, {
      ...posture,
      limbs,
    }), undefined, undefined, resolution, undefined, projection).pose;
    const goal: IHumanPosture.IGoal = carry.goal(posture, seconds, resolution, projection);
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
      base: { pose, others: [...(goal.clear ?? []), ...(goal.rests ?? [])] },
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
    carry: AutoMovieMotionHumanArmPlanned.IPlanned,
    posture: IHumanPosture,
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IHumanPosture.IGoal {
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
    body: IHumanBody,
    pose: IAutoMoviePose,
    carry: AutoMovieMotionHumanArmPlanned.IPlanned,
    goal: IHumanPosture.IGoal,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): HumanArmTrajectory.ISite {
    const world: IHumanPosture.IGoal = resolveHumanPosture.world(
      body,
      pose,
      `${carry.side}Arm`,
      goal,
      source === undefined || goal.on === undefined ? undefined :
        (): ReturnType<typeof poseBones> => poseBones(body, pose,
          prepareHumanPoseResolution(source)(), new Set<AutoMovieHumanoidBone>([goal.on!])),
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
      disc: carry.disc ?? AutoMovieMotionHumanAuditTangle.BUILT,
      ...(world.rotation === undefined ? {} : { rotation: world.rotation }),
    };
  }
}

/** Samples along the same original joint-space blend for arc measurement. */
const ARC: number = 32;

