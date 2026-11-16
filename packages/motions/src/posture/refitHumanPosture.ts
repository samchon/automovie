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
 * Reader snapshots never enter returned poses, seeds, values or body memory.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States person/pose frame, attachment order, pair policy, lazy owned-or-borrowed reader scope and nonescaping result boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the existing placed-arm order, world attachment transforms and independent-or-coupled arm law. Exact scalar FK dependencies permit unchanged articulation/ancestor math to be reused while changed limbs and descendant frames are recomputed normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the original refit loop; applyHumanLimbFit reconstructs actual owned chain edits, memory owns lookup and HumanLimbPair owns coupling. Nonempty public refits copy once on return, while the original no-goal borrowed-pose result remains a no-work path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal, rival, near seed, actual fit and ordering rule remains unchanged. Mirror/root-frame transformations still select actual solve inputs and invalidate changed FK scalar dependencies; no target, body-memory key, approximation or result cache is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms No-goal inputs return before graph/placed-arm construction or copying. At most four goal entries retain actual bounded searches; owned edit recipes copy only chain/toe records between limbs and one final complete copy isolates the nonempty public result. Exact FK metadata is shared, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only same-valued FK prerequisites are shared. A standalone refit owns its lazy reader; an explicit parent can lend one across leaf calls in the same synchronous person evaluation. Each limb retains its actual source/target/callback/cold-near policy, and body-memory keys and hits remain unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Private cached poses never enter the refit: each edit owns replacement/seed/value data and borrows only the current caller-owned untouched records. Nonempty return deep-copies all output metadata once; no-goal input retains its original borrowed pose contract. Readers end with the operation and never enter outputs or body memory.
 */
export function refitHumanPosture(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limbs: IHumanPosture["limbs"],
  near: resolveHumanPosture.INear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): resolveHumanPosture.ISeeded {
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
        const pair: HumanLimbPair.IFitted = HumanLimbPair.fitted(
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
    const fitted: IAutoMovieSeededChainFit = applyHumanLimbFit(
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
  return structuredClone({ pose, seeds, values });
}
