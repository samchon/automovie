import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanLimbFit } from "./HumanLimbFit";
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
 * Each arm's own fit may continue a nearby one (`IAutoMovieSwivelNear`),
 * and reports the seed it was chosen at. Either representative solves an
 * arm the same way, as the right arm in its own side's frame
 * (`HumanLimbFit.fit`), so an arm's seed and its `near` are that arm's
 * whichever representative is taken.
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
   * @param near Each arm's nearby fit to continue, if any.
   * @returns The pose with both arms fitted, and the seed each arm's own fit was chosen at.
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
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    goals: Readonly<
      Record<"left" | "right", IAutoMovieMotionHumanPosture.IGoal>
    >,
    near: Readonly<
      Partial<Record<"left" | "right", IAutoMovieSwivelNear>>
    > = {},
  ): IFitted {
    const mirrored: IAutoMoviePose = HumanArmMirror.mirrored({
      pose,
      others: [],
    }).pose;
    const image: Record<"left" | "right", IAutoMovieMotionHumanPosture.IGoal> =
      {
        left: HumanLimbFit.reflected(goals.right),
        right: HumanLimbFit.reflected(goals.left),
      };
    // The inputs serialised by content, each joint under its bone's name in
    // name order, so the mirror's exchange of the sides' names reorders
    // nothing.
    const key = (
      p: IAutoMoviePose,
      g: Readonly<Record<"left" | "right", IAutoMovieMotionHumanPosture.IGoal>>,
    ): string =>
      JSON.stringify([
        p.root,
        [...p.joints]
          .sort((x: IAutoMovieJointPose, y: IAutoMovieJointPose): number =>
            x.bone < y.bone ? -1 : x.bone > y.bone ? 1 : 0,
          )
          .map((j: IAutoMovieJointPose) => [
            j.bone,
            j.flexion ?? null,
            j.abduction ?? null,
            j.twist ?? null,
          ]),
        g.left,
        g.right,
      ]);
    if (key(pose, goals) <= key(mirrored, image))
      return solved(body, pose, goals, near);
    // The image's left arm is this pose's right arm, solved alike.
    const out: IFitted = solved(body, mirrored, image, {
      ...(near.right === undefined ? {} : { left: near.right }),
      ...(near.left === undefined ? {} : { right: near.left }),
    });
    return {
      pose: HumanArmMirror.mirrored({ pose: out.pose, others: [] }).pose,
      seeds: { left: out.seeds.right, right: out.seeds.left },
      values: { left: out.values.right, right: out.values.left },
    };
  }

  /**
   * Both arms fitted, with the seed each arm's own fit was chosen at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The pose and one seed per arm, null where the fit has none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`.
   */
  export interface IFitted {
    /** The pose with both arms fitted. */
    pose: IAutoMoviePose;

    /** Each arm's seed. */
    seeds: Record<"left" | "right", IAutoMovieSwivelSeed | null>;

    /** Each arm's own fit's value (`IAutoMovieSeededChainFit.value`); absent where the coupled solve replaced the arms' own fits. */
    values: Record<"left" | "right", IAutoMovieSeededChainFit["value"]>;
  }
}

/** The pair fitted on the representative: independent fits, or the coupled solve where they meet. */
function solved(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  goals: Readonly<Record<"left" | "right", IAutoMovieMotionHumanPosture.IGoal>>,
  near: Readonly<Partial<Record<"left" | "right", IAutoMovieSwivelNear>>>,
): HumanLimbPair.IFitted {
  const world = (
    limb: "leftArm" | "rightArm",
  ): IAutoMovieMotionHumanPosture.IGoal =>
    HumanLimbFit.world(
      body,
      pose,
      limb,
      goals[limb === "leftArm" ? "left" : "right"],
    );
  const own: Record<"left" | "right", IAutoMovieSeededChainFit> = {
    left: HumanLimbFit.remembered(
      body,
      pose,
      "leftArm",
      goals.left,
      [],
      world("rightArm").point,
      near.left,
    ),
    right: HumanLimbFit.remembered(
      body,
      pose,
      "rightArm",
      goals.right,
      [],
      world("leftArm").point,
      near.right,
    ),
  };
  const seeds: Record<"left" | "right", IAutoMovieSwivelSeed | null> = {
    left: own.left.seed,
    right: own.right.seed,
  };
  const arm = (
    p: IAutoMoviePose,
    side: "left" | "right",
  ): IAutoMovieMotionHumanArmClearance.IArm => {
    const read = (
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const j: IAutoMovieJointPose | undefined = p.joints.find(
        (x: IAutoMovieJointPose): boolean => x.bone === bone,
      );
      return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
    };
    return {
      upper: read(`${side}UpperArm`),
      lower: read(`${side}LowerArm`),
      hand: read(`${side}Hand`),
    };
  };
  const fits: Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IArm> =
    {
      left: arm(own.left.pose, "left"),
      right: arm(own.right.pose, "right"),
    };
  const both: IAutoMoviePose = HumanArmClearance.posed(
    HumanArmClearance.posed(pose, "left", fits.left),
    "right",
    fits.right,
  );

  // Each arm's forearm against the other arm's segments alone.
  const bones = poseBones(body, both);
  const meets = (side: "left" | "right"): boolean => {
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const shapes: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanArmClearance.obstacles(body, bones, [other]).filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone.startsWith(other) && /(UpperArm|LowerArm|Hand)$/.test(s.bone),
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
  if (!meets("left") && !meets("right"))
    return {
      pose: both,
      seeds,
      values: { left: own.left.value, right: own.right.value },
    };

  // The arms meet: one still configuration of both, drawn to their fits,
  // each hand on its goal, the two arms' probes clear of each other.
  const site = (side: "left" | "right"): M.ISite => {
    const goal: IAutoMovieMotionHumanPosture.IGoal = world(
      side === "left" ? "leftArm" : "rightArm",
    );
    const contact: IAutoMovieVector3 = goal.contact ?? { x: 0, y: 0, z: 0 };
    return {
      point: Vector3.add(
        goal.point,
        Quaternion.rotateVector(
          goal.rotation ?? Quaternion.identity(),
          contact,
        ),
      ),
      contact,
      disc: M.TOLERANCE / 1000,
      ...(goal.rotation === undefined ? {} : { rotation: goal.rotation }),
    };
  };
  const others: IAutoMovieMotionHumanColliders.IPlaced[] = (
    ["left", "right"] as const
  ).flatMap(
    (side: "left" | "right"): IAutoMovieMotionHumanColliders.IPlaced[] => [
      ...(goals[side].clear ?? []),
      ...(goals[side].rests ?? []),
    ],
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
  const start: number[][][] = sides.map(
    (side: "left" | "right", a: number): number[][] => [
      [...context.rest[a]!],
      G.encode(context.setups[a]!, fits[side]),
      [...context.back[a]!],
    ],
  );
  const result: { x: number[][][] } = HumanArmOptimiser.optimise(
    context,
    start,
  );
  let out: IAutoMoviePose = pose;
  sides.forEach((side: "left" | "right", a: number): void => {
    out = HumanArmClearance.posed(
      out,
      side,
      G.arm(context.setups[a]!, result.x[a]![1]!),
    );
  });
  return { pose: out, seeds, values: { left: undefined, right: undefined } };
}
