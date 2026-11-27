import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "../HumanLimbFit";
import { HumanLimbPair } from "../HumanLimbPair";
import type { HumanLimbView } from "../HumanLimbView";
import { applyHumanLimbFit } from "./applyHumanLimbFit";
import { orderHumanLimbs } from "./orderHumanLimbs";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Fit one person's already placed pose in attachment order, with independent
 * arms handled by the same coupled pair solver. The first goal prepares a lazy
 * reader getter, and the first FK demand creates or borrows its reader. An
 * explicit parent may lend its reader within the same person evaluation. Reader
 * snapshots never enter returned poses, seeds or values. Every limb fit is
 * solved directly (`solveHumanLimbFit`); the entries differ only in whether the
 * pose is the assembly's own (`constructed`, whose admission is known) and in
 * the continued curve's solver policy (`continued`).
 */
export function refitHumanPosture(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  return fitted(body, pose, limbs, near, resolution, applyHumanLimbFit);
}

/**
 * The refit routes of an assembly's own pose and of the owned continuous curve,
 * both on the direct solve.
 */
export namespace refitHumanPosture {
  /**
   * The refit of a pose a base-free assembly just made, one clamped record a
   * rig bone: the same ordered direct solves, with the whole pose's admission
   * skipped where every record is already well formed (`fitted`).
   *
   * @param body The performer's body.
   * @param pose The assembly's pose.
   * @param limbs The goals, world goals already turned.
   * @param near Each limb's nearby fit to continue.
   * @param resolution Optional FK reader or lazy supplier of the same
   *   synchronous evaluation.
   * @returns The pose, seeds and values; untouched records are the assembly's.
   */
  export function constructed(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    assess?: HumanLimbPair.Assessment,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return fitted(
      body,
      pose,
      limbs,
      near,
      resolution,
      applyHumanLimbFit,
      true,
      assess,
    );
  }

  /**
   * Correct an actual owned free-leg curve under its explicit continuous
   * policy.
   *
   * Defines the owned free-leg source, current actual goals/seeds and
   * independent fit result. The free-curve producer owns deterministic phase
   * continuation and independently checks all current physical constraints;
   * this entry chooses the engine's current hinged correction for its actual
   * legs. Reuses the same ordered refit kernel and pair solve; the supported
   * curve has no arm/contact context. Public cold/near fitting retains its
   * original entry; no changed goal, branch answer, readiness flag or relaxed
   * bound is introduced. Avoids generic pole/source ranking before an accepted
   * current hinged correction while preserving actual checks; gains are
   * unmeasured. Uses the same actual source reader, solving every request
   * afresh with no prior pose replay. Source, readers and policy remain
   * synchronous and no output or query history is retained here.
   */
  export function continued(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return fitted(
      body,
      pose,
      limbs,
      near,
      resolution,
      applyHumanLimbFit.continued,
      true,
    );
  }
}

/**
 * Keep the original limb-order loop once; only the entry's limb fit differs. An
 * `assembled` pose is the base-free assembly's own, one clamped record a rig
 * bone.
 */
function fitted(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0],
  fit: (
    ...args: Parameters<typeof applyHumanLimbFit>
  ) => ReturnType<typeof applyHumanLimbFit>,
  assembled: boolean = false,
  assess?: HumanLimbPair.Assessment,
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  if (
    limbs.leftLeg === undefined &&
    limbs.rightLeg === undefined &&
    limbs.leftArm === undefined &&
    limbs.rightArm === undefined
  )
    return { pose, seeds: {}, values: {} };
  let readResolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;

  // The limbs are fitted in turn on one pose, each fit's pose the last
  // one's with that limb's solved records, so the whole pose is admitted
  // once, by the first fit that reads it.
  //
  // A pose the assembly just made holds one record a bone, each with the
  // bone's own name and three angles, so its admission has nothing to
  // refuse and is not run. The root is read by every fit's own reduced pose.
  const admission: HumanLimbView.IAdmission = { admitted: assembled };
  const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = {};
  const values: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["values"] = {};
  const placed: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => limbs[`${side}Arm`] === undefined,
  );
  const arms: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal | undefined> =
    {
      left: limbs.leftArm,
      right: limbs.rightArm,
    };
  const riding: (
    goal: IAutoMovieHumanLimbGoal | undefined,
    other: AutoMovieHumanSide,
  ) => boolean = (
    goal: IAutoMovieHumanLimbGoal | undefined,
    other: AutoMovieHumanSide,
  ): boolean => goal?.on !== undefined && goal.on.startsWith(other);
  const paired: boolean =
    arms.left !== undefined &&
    arms.right !== undefined &&
    arms.left.seed === undefined &&
    arms.right.seed === undefined &&
    !riding(arms.left, "right") &&
    !riding(arms.right, "left");
  for (const limb of orderHumanLimbs(limbs)) {
    const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
    if (goal === undefined) continue;

    // A goal that carries its law's own planned seed (`IAutoMovieHumanLimbGoal
    // .seed`) places its limb there in closed form, over any seed the reader
    // continues, with no search: the plan is the one model every reader of
    // the goal shares, and it stands by the plan's construction.
    if (goal.seed !== undefined) {
      const at: ReturnType<typeof HumanLimbFit.at> = HumanLimbFit.at(
        body,
        pose,
        limb,
        goal,
        goal.seed.swivel,
        goal.seed.branch,
      );
      if (at === null)
        throw new Error(
          `the ${limb}'s planned seed places no hinged chain at its goal`,
        );
      pose = at.pose;
      seeds[limb] = at.seed;
      values[limb] = at.value;
      if (limb === "leftArm") placed.push("left");
      if (limb === "rightArm") placed.push("right");
      continue;
    }
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      (readResolution ??= prepareHumanPoseResolution(resolution));
    if (paired && (limb === "leftArm" || limb === "rightArm")) {
      if (placed.length === 0) {
        const pair: HumanLimbPair.IFitted = HumanLimbPair.fitted(
          body,
          pose,
          { left: arms.left!, right: arms.right! },
          {
            ...(near.leftArm === undefined ? {} : { left: near.leftArm }),
            ...(near.rightArm === undefined ? {} : { right: near.rightArm }),
          },
          read,
          assess,
        );
        pose = pair.pose;
        seeds.leftArm = pair.seeds.left;
        seeds.rightArm = pair.seeds.right;
        values.leftArm = pair.values.left;
        values.rightArm = pair.values.right;
      }
      placed.push(limb === "leftArm" ? "left" : "right");
      continue;
    }
    const other: AutoMovieHumanLimb | undefined =
      limb === "leftArm"
        ? "rightArm"
        : limb === "rightArm"
          ? "leftArm"
          : undefined;
    const coming: IAutoMovieHumanLimbGoal | undefined =
      other === undefined ||
      placed.includes(other === "leftArm" ? "left" : "right")
        ? undefined
        : limbs[other];
    const rival: IAutoMovieVector3 | undefined =
      coming === undefined || other === undefined
        ? undefined
        : HumanLimbFit.world(
            body,
            pose,
            other,
            coming,
            (): ReturnType<typeof poseBones> =>
              poseBones(
                body,
                pose,
                read(),
                coming.on === undefined ? undefined : new Set([coming.on]),
              ),
          ).point;
    const fitted: IAutoMovieSeededChainFit = fit(
      body,
      pose,
      limb,
      goal,
      placed,
      rival,
      near[limb],
      read,
      admission,
    );
    pose = fitted.pose;
    seeds[limb] = fitted.seed;
    values[limb] = fitted.value;
    if (limb === "leftArm") placed.push("left");
    if (limb === "rightArm") placed.push("right");
  }
  return { pose, seeds, values };
}
