import { type IAutoMovieSeededChainFit } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbPair } from "./HumanLimbPair";
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the original refit loop extracted from resolveHumanPosture; HumanLimbFit, its memory and HumanLimbPair receive one operation reader, while target solving and pair optimization remain with their existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal, rival, near seed, actual fit and ordering rule remains unchanged. Mirror/floor transformations still select actual solve inputs and invalidate changed FK scalar dependencies; no target, body-memory key, approximation or result cache is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four goal entries invoke the same bounded limb searches or one coupled arm solve. Their full FK still scans every authored record and reachable bone, but identical completed math shares one reader instead of restarting per limb. Pair/solver numerical work and output copies remain, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only same-valued FK prerequisites are shared. A standalone refit owns its lazy reader; an explicit parent can lend one across leaf calls in the same synchronous person evaluation. Each limb retains its actual source/target/callback/cold-near policy, and body-memory keys and hits remain unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The standalone reader's last scalar joint/world snapshots end with return or throw; a borrowed reader belongs to its parent evaluation. No-goal paths create no refit-local getter and memory hits never invoke one. Only pose/seeds/values escape; no stored body fit, plan, callback or handle captures getter or reader.
 */
export function refitHumanPosture(
  body: IHumanBody,
  pose: IAutoMoviePose,
  limbs: IHumanPosture["limbs"],
  near: resolveHumanPosture.INear,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): resolveHumanPosture.ISeeded {
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
    const fitted: IAutoMovieSeededChainFit = HumanLimbFit.remembered(
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
