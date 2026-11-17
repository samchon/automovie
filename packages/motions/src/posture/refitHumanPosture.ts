import { type IAutoMovieSeededChainFit } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbPair } from "./HumanLimbPair";
import { applyHumanLimbFit } from "./applyHumanLimbFit";
import type { IHumanPosture } from "./IHumanPosture";
import { orderHumanLimbs } from "./orderHumanLimbs";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * Fit one person's already placed pose in attachment order, with independent
 * arms handled by the same coupled pair solver. The first goal prepares a
 * lazy reader getter, and the first FK demand creates or borrows its reader.
 * An explicit parent may lend its reader within the same person evaluation.
 * Reader snapshots never enter returned poses, seeds or values. Every limb
 * fit is solved directly (`solveHumanLimbFit`); the entries differ only in
 * the solver policy, the continued curve's current hinged correction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States person/pose frame, attachment order, pair policy, lazy owned-or-borrowed reader scope and the direct solve. Member facts: continued: Defines the owned free-leg source and its continuous solver policy. constructed: Defines fresh constructor output and the ordinary direct solve.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the existing placed-arm order, world attachment transforms and independent-or-coupled arm law. Exact scalar FK dependencies permit unchanged articulation/ancestor math to be reused while changed limbs and descendant frames are recomputed normally. Member facts: continued: The free-curve producer owns deterministic phase continuation and checks all current physical constraints; this entry chooses the engine's current hinged correction for its legs. constructed: The ordinary direct solve.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared kernel owns original limb order/coupling; each entry passes its limb fit and pair owner. Member facts: continued: The same kernel with the continuous policy and constructed pair owner. constructed: The same kernel with the constructed limb/pair entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal, rival, near seed, actual fit and ordering rule remains unchanged; no key, stored answer or approximation is added. Member facts: continued: No changed goal, branch answer, readiness flag or relaxed bound. constructed: No changed goal, skipped admission or altered constraint.
 * @evidence contracts/development/implementation.md#efficient-algorithms No-goal inputs return before graph/placed-arm construction/copying. At most four goals each pay their actual solve, with no key, lookup or result clone; speedup is unmeasured. Member facts: continued: Avoids generic pole/source ranking before an accepted current hinged correction. constructed: The same solves.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only same-valued FK prerequisites are shared. A standalone refit owns its lazy reader; an explicit parent can lend one across leaf calls in the same synchronous person evaluation; each fit is solved afresh. Member facts: continued: The same actual source reader, with no prior pose replay. constructed: The same.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Results are the solved records, sharing untouched records with the input pose; no-goal input keeps its borrowing contract. Readers end with the operation and never enter output. Member facts: continued: Source, readers and policy remain synchronous. constructed: Current source/output and FK loan remain within the caller's synchronous operation.
 */
export function refitHumanPosture(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limbs: IHumanPosture["limbs"],
  near: resolveHumanPosture.INear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): resolveHumanPosture.ISeeded {
  return fitted(body, pose, limbs, near, resolution, applyHumanLimbFit, HumanLimbPair.owned);
}

/**
 * The refit routes: base-free assembly, the owned continuous curve and public
 * explicit-pose refits, all on the direct solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three routes and the one solver they share.
 * @evidence contracts/development/design.md#principled-representation Each route selects its solver policy and pair entry while the shared kernel owns every ordering and physical decision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Public refit, explicit-base seeded and incoming-reader routes use independent; private assembly uses the internal entry; the free-leg curve uses continued.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Accepts no caller-provided fitter, stored result or resolved state; a public caller wanting independent records clones at its own boundary (resolveHumanPosture.refit does).
 */
export namespace refitHumanPosture {
  /**
   * Fit actual base-free assembly with its known native clinical schema.
   *
   * Defines fresh constructor output, current goal/near/FK inputs and ordinary seeded result.
   * The sole base-free assembly producer constructs all clinical record fields before entering this refit; each limb is the ordinary direct solve.
   * Selects constructed limb/pair entries in the same goal-order kernel.
   * No mutable public/base source, numerical ownership flag, changed goal, skipped admission or altered constraint is accepted by its actual producer call path.
   * Preserves all requested inverse kinematics; total runtime remains unmeasured.
   * Shares the original goal ordering, arm pairing and direct solve.
   * Current source/output and FK loan remain within the caller's synchronous operation; no input, reader, result history or new handle is retained here.
   */
  export function constructed(body: IHumanBody, pose: IAutoMoviePose, limbs: IHumanPosture["limbs"],
    near: resolveHumanPosture.INear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): resolveHumanPosture.ISeeded {
    return fitted(body, pose, limbs, near, resolution, applyHumanLimbFit.constructed, HumanLimbPair.constructed);
  }

  /**
   * Correct an actual owned free-leg curve under its explicit continuous policy.
   *
   * Defines the owned free-leg source, current actual goals/seeds and independent fit result.
   * The free-curve producer owns deterministic phase continuation and independently checks all current physical constraints; this entry chooses the engine's current hinged correction for its actual legs.
   * Reuses the same ordered refit kernel and constructed pair owner; the supported curve has no arm/contact context.
   * Public cold/near fitting retains its original entry; no changed goal, branch answer, readiness flag or relaxed bound is introduced.
   * Avoids generic pole/source ranking before an accepted current hinged correction while preserving actual checks; gains are unmeasured.
   * Uses the same actual source reader, solving every request afresh with no prior pose replay.
   * Source, readers and policy remain synchronous and no output or query history is retained here.
   */
  export function continued(body: IHumanBody, pose: IAutoMoviePose, limbs: IHumanPosture["limbs"],
    near: resolveHumanPosture.INear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): resolveHumanPosture.ISeeded {
    return fitted(body, pose, limbs, near, resolution, applyHumanLimbFit.continued, HumanLimbPair.constructed);
  }

  /** Same physical loop for public explicit-pose refits, with the public pair entry and no-goal borrowing. */
  export function independent(body: IHumanBody, pose: IAutoMoviePose, limbs: IHumanPosture["limbs"],
    near: resolveHumanPosture.INear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): resolveHumanPosture.ISeeded {
    return fitted(body, pose, limbs, near, resolution, HumanLimbFit.remembered, HumanLimbPair.fitted);
  }
}

/** Keep the original limb-order loop once; only the entry's limb fit and pair owner differ. */
function fitted(body: IHumanBody, pose: IAutoMoviePose, limbs: IHumanPosture["limbs"], near: resolveHumanPosture.INear,
  resolution: Parameters<typeof prepareHumanPoseResolution>[0], fit: (...args: Parameters<typeof applyHumanLimbFit>) => ReturnType<typeof applyHumanLimbFit>,
  pairFit: typeof HumanLimbPair.fitted): resolveHumanPosture.ISeeded {
  if (limbs.leftLeg === undefined && limbs.rightLeg === undefined &&
    limbs.leftArm === undefined && limbs.rightArm === undefined) return { pose, seeds: {}, values: {} };
  let readResolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
  const seeds: resolveHumanPosture.ISeeded["seeds"] = {};
  const values: resolveHumanPosture.ISeeded["values"] = {};
  const placed: ("left" | "right")[] = (["left", "right"] as const).filter(
    (side: "left" | "right"): boolean => limbs[`${side}Arm`] === undefined,
  );
  const arms: Record<"left" | "right", IHumanPosture.IGoal | undefined> = {
    left: limbs.leftArm,
    right: limbs.rightArm,
  };
  const riding: (
    goal: IHumanPosture.IGoal | undefined,
    other: "left" | "right",
  ) => boolean = (
    goal: IHumanPosture.IGoal | undefined,
    other: "left" | "right",
  ): boolean => goal?.on !== undefined && goal.on.startsWith(other);
  const paired: boolean =
    arms.left !== undefined &&
    arms.right !== undefined &&
    !riding(arms.left, "right") &&
    !riding(arms.right, "left");
  for (const limb of orderHumanLimbs(limbs)) {
    const goal: IHumanPosture.IGoal | undefined = limbs[limb];
    if (goal === undefined) continue;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      (readResolution ??= prepareHumanPoseResolution(resolution));
    if (paired && (limb === "leftArm" || limb === "rightArm")) {
      if (placed.length === 0) {
        const pair: HumanLimbPair.IFitted = pairFit(
          body,
          pose,
          { left: arms.left!, right: arms.right! },
          {
            ...(near.leftArm === undefined ? {} : { left: near.leftArm }),
            ...(near.rightArm === undefined ? {} : { right: near.rightArm }),
          },
          read,
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
    const other: IHumanPosture.Limb | undefined =
      limb === "leftArm"
        ? "rightArm"
        : limb === "rightArm"
          ? "leftArm"
          : undefined;
    const coming: IHumanPosture.IGoal | undefined =
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
            (): ReturnType<typeof poseBones> => poseBones(body, pose, read(),
              coming.on === undefined ? undefined : new Set([coming.on])),
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
    );
    pose = fitted.pose;
    seeds[limb] = fitted.seed;
    values[limb] = fitted.value;
    if (limb === "leftArm") placed.push("left");
    if (limb === "rightArm") placed.push("right");
  }
  return { pose, seeds, values };
}
