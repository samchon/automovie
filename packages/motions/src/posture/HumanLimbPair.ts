import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import type { HumanColliders } from "./HumanColliders";
import { HumanLimbFit } from "./HumanLimbFit";
import type { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * Two arms with goals fitted as one coupled problem, symmetric in the two
 * arms by construction.
 *
 * Each arm is first fitted on its own (`HumanLimbFit.remembered`), the
 * other arm only a coming wrist, so neither fit depends on the other's.
 * Arms whose fits keep clear of each other (`HumanArmClearance.overshoot`
 * against the other arm's segments alone) are done: their fits are
 * independent and need no order. Arms that meet are solved together, the
 * still configuration of both arms (`HumanArmTrajectoryModel`, the two arms'
 * probes kept clear of each other) drawn to the two independent fits, each
 * hand held on its goal, by the trajectory's own optimiser.
 *
 * The coupled solve is computed on a canonical representative of the pair
 * and its mirror image: of the posture and its mirror, the one whose inputs
 * serialise first, the other read as its mirror. A posture and its mirror
 * image so solve one problem and give mirror images to the bit, and a
 * posture that is its own mirror image is its own representative.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two stages, when the second runs, what it minimises and how its symmetry is made.
 * @evidence contracts/development/design.md#principled-representation Two interacting arms are one problem; the canonical form under the mirror is a representative of the pair's orbit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `resolveHumanPosture` for two arms with goals.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No order between the arms: independent fits, or one joint solve.
 */
export namespace HumanLimbPair {
  /**
   * The pose with both arms fitted.
   *
   * @param body The body.
   * @param pose The pose before the arms, its legs fitted.
   * @param goals Each arm's goal.
   * @returns The pose with both arms fitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Independent fits where the arms keep clear; a coupled still solve where they meet, on the pair's canonical representative under the mirror.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fits, one clearance reading per arm, then one coupled solve when they meet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither arm is fitted against the other's fit; the representative is chosen from the inputs alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two remembered fits; a coupled solve only where the arms meet.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanLimbFit`, `HumanArmClearance`, the trajectory's context, model and optimiser.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fitted(
    body: IHumanBody,
    pose: IAutoMoviePose,
    goals: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
  ): IAutoMoviePose {
    const mirrored: IAutoMoviePose = HumanArmMirror.mirrored({ pose, others: [] }).pose;
    const image: Record<"left" | "right", IHumanPosture.IGoal> = {
      left: HumanLimbFit.reflected(goals.right),
      right: HumanLimbFit.reflected(goals.left),
    };
    // The inputs serialised by content, each joint under its bone's name in
    // name order, so the mirror's exchange of the sides' names reorders
    // nothing.
    const key = (p: IAutoMoviePose, g: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>): string =>
      JSON.stringify([
        p.root,
        [...p.joints]
          .sort((x: IAutoMovieJointPose, y: IAutoMovieJointPose): number => (x.bone < y.bone ? -1 : x.bone > y.bone ? 1 : 0))
          .map((j: IAutoMovieJointPose) => [j.bone, j.flexion ?? null, j.abduction ?? null, j.twist ?? null]),
        g.left,
        g.right,
      ]);
    return key(pose, goals) <= key(mirrored, image)
      ? solved(body, pose, goals)
      : HumanArmMirror.mirrored({ pose: solved(body, mirrored, image), others: [] }).pose;
  }
}

/** The pair fitted on the representative: independent fits, or the coupled solve where they meet. */
function solved(
  body: IHumanBody,
  pose: IAutoMoviePose,
  goals: Readonly<Record<"left" | "right", IHumanPosture.IGoal>>,
): IAutoMoviePose {
  const world = (limb: "leftArm" | "rightArm"): IHumanPosture.IGoal =>
    HumanLimbFit.world(body, pose, limb, goals[limb === "leftArm" ? "left" : "right"]);
  const own = {
    left: HumanLimbFit.remembered(body, pose, "leftArm", goals.left, [], world("rightArm").point),
    right: HumanLimbFit.remembered(body, pose, "rightArm", goals.right, [], world("leftArm").point),
  };
  const arm = (p: IAutoMoviePose, side: "left" | "right"): HumanArmClearance.IArm => {
    const read = (bone: AutoMovieHumanoidBone): readonly [number, number, number] => {
      const j: IAutoMovieJointPose | undefined = p.joints.find((x: IAutoMovieJointPose): boolean => x.bone === bone);
      return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
    };
    return { upper: read(`${side}UpperArm`), lower: read(`${side}LowerArm`), hand: read(`${side}Hand`) };
  };
  const fits: Record<"left" | "right", HumanArmClearance.IArm> = { left: arm(own.left, "left"), right: arm(own.right, "right") };
  const both: IAutoMoviePose = HumanArmClearance.posed(HumanArmClearance.posed(pose, "left", fits.left), "right", fits.right);

  // Each arm's forearm against the other arm's segments alone.
  const bones = poseBones(body, both);
  const meets = (side: "left" | "right"): boolean => {
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const shapes: HumanColliders.IPlaced[] = HumanArmClearance.obstacles(body, bones, [other]).filter(
      (s: HumanColliders.IPlaced): boolean => s.bone.startsWith(other) && /(UpperArm|LowerArm|Hand)$/.test(s.bone),
    );
    return (
      HumanArmClearance.overshoot(
        body,
        shapes,
        bones.get(`${side}LowerArm`)!.worldPosition,
        bones.get(`${side}Hand`)!.worldPosition,
        side,
      ) > 0
    );
  };
  if (!meets("left") && !meets("right")) return both;

  // The arms meet: one still configuration of both, drawn to their fits,
  // each hand on its goal, the two arms' probes clear of each other.
  const site = (side: "left" | "right"): M.ISite => {
    const goal: IHumanPosture.IGoal = world(side === "left" ? "leftArm" : "rightArm");
    const contact: IAutoMovieVector3 = goal.contact ?? { x: 0, y: 0, z: 0 };
    return {
      point: Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation ?? Quaternion.identity(), contact)),
      contact,
      disc: M.TOLERANCE / 1000,
      ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
    };
  };
  const others: HumanColliders.IPlaced[] = (["left", "right"] as const).flatMap(
    (side: "left" | "right"): HumanColliders.IPlaced[] => [...(goals[side].clear ?? []), ...(goals[side].rests ?? [])],
  );
  const base: G.IBase = { pose, others };
  const sides = ["right", "left"] as const;
  const context: M.IContext = HumanArmTrajectoryContext.of({
    body,
    times: [0, 1, 2],
    bases: [base, base, base],
    arms: sides.map((side: "left" | "right") => ({
      side,
      rest: arm(pose, side),
      sites: [undefined, site(side), undefined],
      anchor: fits[side],
    })),
    still: true,
  });
  const start: number[][][] = sides.map((side: "left" | "right", a: number): number[][] => [
    [...context.rest[a]!],
    G.encode(context.setups[a]!, fits[side]),
    [...context.back[a]!],
  ]);
  const result: { x: number[][][] } = HumanArmOptimiser.optimise(context, start);
  let out: IAutoMoviePose = pose;
  sides.forEach((side: "left" | "right", a: number): void => {
    out = HumanArmClearance.posed(out, side, G.arm(context.setups[a]!, result.x[a]![1]!));
  });
  return out;
}
