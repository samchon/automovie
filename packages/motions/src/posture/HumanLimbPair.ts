import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
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
import type { HumanLimbView } from "./HumanLimbView";
import { applyHumanLimbFit } from "./applyHumanLimbFit";
import { compareHumanLimbPair } from "./compareHumanLimbPair";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Two arms with goals fitted as one coupled problem, symmetric in the two
 * arms by construction.
 *
 * Each arm is first fitted on its own (`applyHumanLimbFit`), the
 * other arm only a coming wrist, so neither fit depends on the other's.
 * Arms whose fits keep clear of each other (`HumanArmClearance.overshoot`
 * against the other arm's segments alone) are done: their fits are
 * independent and need no order. Arms that meet are solved together, the
 * still configuration of both arms (`HumanArmTrajectoryModel`, the two arms'
 * probes kept clear of each other) drawn to the two independent fits, each
 * hand held on its goal, by the trajectory's own optimiser. Arms both
 * placed at a prescribed swivel course (a display read of a course or an
 * anchor whose swivels the coupled solve left) are decoupled: each hand's
 * goal is the plan's own contact frame at that second and each arm its own
 * closed-form fit, so the coupled solve runs only where the course is made.
 *
 * The coupled solve is computed on a canonical representative of the pair
 * and its mirror image: of the posture and its mirror, the one whose inputs
 * serialise first, the other read as its mirror. A posture and its mirror
 * image so solve one problem and give mirror images to the bit, and a
 * posture that is its own mirror image is its own representative.
 *
 * Each arm's own fit may continue a nearby one (`IAutoMovieSwivelNear`),
 * and reports the seed it was chosen at; arms solved together report the
 * swivel and branch their coupled configuration sits at, so a placement
 * prescribed there reproduces it in closed form. Either representative
 * solves an arm the same way, as the right arm in its own side's frame
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
   * Observe the returned two-arm fit during this static posture request. In
   * analytic mode a trial that needs the general optimiser returns its direct
   * result and reports that result's residual for the caller to reject.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the observed posture, the lifetime of the observer and the analytic-only trial behavior.
   * @evidence contracts/development/design.md#principled-representation The callback observes the existing native evaluation, which carries the fit's geometric residuals in their original units. The flag selects whether the general optimiser can run.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The paired fitter owns this request. The caller needs one native residual report and one search policy to compare its posture trials.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both search modes report the actual evaluation through the same typed callback. The mode does not mark a failed candidate as accepted.
   */
  export interface Assessment {
    /**
     * Read the complete native model at the returned pair. Consume the
     * evaluation during the call if a stable observation is needed.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies the evaluation passed to the receiver and its request lifetime.
     * @evidence contracts/development/implementation.md#principled-implementation The fitter supplies the evaluation from the accepted direct or adjusted pair, the returned direct trial, or the general optimiser's result.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One callback receives the already available evaluation on the selected return branch.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No residual is synthesized or replaced by a convenience success value.
     * @evidence contracts/development/implementation.md#efficient-algorithms The fitter passes the current evaluation without another model evaluation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The same reading serves native branch admission and the caller's trial comparison.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fitter holds the callback only for the current request and does not attach it to the returned fit.
     */
    inspect(reading: Readonly<M.IEvaluation>): void;
    /** Only certified ordinary analytic branches can win a speculative trial. */
    analytic: boolean;
  }

  /**
   * The pose with both arms fitted.
   *
   * @param body The body.
   * @param pose The pose before the arms, its legs fitted.
   * @param goals Each arm's goal.
   * @param near Each arm's nearby fit to continue, if any.
   * @param resolution Optional parent-owned exact reader or lazy supplier; a standalone pair creates a reader only on first actual FK demand.
   * @returns The pose with both arms fitted, and the seed each arm's own fit was chosen at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Independent fits where the arms keep clear or both are placed at a prescribed course whose swivels the coupled solve left; a coupled still solve where they meet otherwise, on the pair's canonical representative under the mirror.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fits, one clearance reading per arm, then one coupled solve when they meet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither arm is fitted against the other's fit; the representative is chosen from the inputs alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two directly solved arm fits, followed by the existing coupled optimizer only on actual overlap. Source attachment FK stays lazy, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing fit, clearance and trajectory owners. A supplied person/refit reader crosses only these synchronous calls; actual mirror/root-frame poses and changed arm descendants still invalidate scalar dependencies, and near/target/result choices remain unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Pair-local source FK and temporary callbacks end with this call. A borrowed reader remains with its synchronous parent, or a lazily created standalone reader ends here; no returned pose, seed, value or retained optimizer context captures the reader or supplier.
   */
  export function fitted(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    goals: Readonly<Record<"left" | "right", IAutoMovieHumanLimbGoal>>,
    near: Readonly<
      Partial<Record<"left" | "right", IAutoMovieSwivelNear>>
    > = {},
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    assess?: Assessment,
  ): IFitted {
    const readResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const mirrored: IAutoMoviePose = HumanArmMirror.mirrored({
      pose,
      others: [],
    }).pose;
    const image: Record<"left" | "right", IAutoMovieHumanLimbGoal> = {
      left: HumanLimbFit.reflected(goals.right),
      right: HumanLimbFit.reflected(goals.left),
    };
    // Whole keys preserve every original getter/toJSON observation and key.
    if (compareHumanLimbPair(pose, goals, mirrored, image) <= 0)
      return solved(body, pose, goals, near, readResolution, assess);
    // The image's left arm is this pose's right arm, solved alike.
    const out: IFitted = solved(
      body,
      mirrored,
      image,
      {
        ...(near.right === undefined ? {} : { left: near.right }),
        ...(near.left === undefined ? {} : { right: near.left }),
      },
      readResolution,
      assess,
    );
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Pose, per-arm seeds and per-arm fit values are the existing data the refit caller consumes.
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
  goals: Readonly<Record<"left" | "right", IAutoMovieHumanLimbGoal>>,
  near: Readonly<Partial<Record<"left" | "right", IAutoMovieSwivelNear>>>,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  assess?: HumanLimbPair.Assessment,
): HumanLimbPair.IFitted {
  let authoredBones:
    | Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    | undefined;
  const readAuthored: () => ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  > = (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    if (authoredBones === undefined) {
      const requested: Set<AutoMovieHumanoidBone> = new Set();
      if (goals.left.on !== undefined) requested.add(goals.left.on);
      if (goals.right.on !== undefined) requested.add(goals.right.on);
      authoredBones = poseBones(body, pose, resolution(), requested);
    }
    return authoredBones;
  };
  const world: Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal> = {
    left: HumanLimbFit.world(body, pose, "leftArm", goals.left, readAuthored),
    right: HumanLimbFit.world(body, pose, "rightArm", goals.right, readAuthored),
  };
  // Both arms are fitted on this one pose, so it is admitted once for both.
  const admission: HumanLimbView.IAdmission = { admitted: false };
  const own: Record<"left" | "right", IAutoMovieSeededChainFit> = {
    left: applyHumanLimbFit(
      body,
      pose,
      "leftArm",
      goals.left,
      [],
      world.right.point,
      near.left,
      resolution,
      admission,
    ),
    right: applyHumanLimbFit(
      body,
      pose,
      "rightArm",
      goals.right,
      [],
      world.left.point,
      near.right,
      resolution,
      admission,
    ),
  };
  const seeds: Record<"left" | "right", IAutoMovieSwivelSeed | null> = {
    left: own.left.seed,
    right: own.right.seed,
  };
  const arm: (
    p: IAutoMoviePose,
    side: "left" | "right",
  ) => IAutoMovieMotionHumanArmClearance.IArm = (
    p: IAutoMoviePose,
    side: "left" | "right",
  ): IAutoMovieMotionHumanArmClearance.IArm => {
    const read: (
      bone: AutoMovieHumanoidBone,
    ) => readonly [number, number, number] = (
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
  const fits: Record<"left" | "right", IAutoMovieMotionHumanArmClearance.IArm> = {
    left: arm(own.left.pose, "left"),
    right: arm(own.right.pose, "right"),
  };
  const both: IAutoMoviePose = HumanArmClearance.posed(
    HumanArmClearance.posed(pose, "left", fits.left),
    "right",
    fits.right,
  );

  // Both arms placed at a prescribed course (a display read): the course's
  // swivels come from coupled solves at its knots and anchors, and each
  // hand's goal is the plan's own contact frame at this second, so the arms
  // are decoupled, each its own closed-form fit clear of its obstruction,
  // and the coupled solve never runs per displayed second.
  if (
    assess === undefined &&
    near.left?.prescribed === true &&
    near.right?.prescribed === true
  )
    return {
      pose: both,
      seeds,
      values: { left: own.left.value, right: own.right.value },
    };

  // Each arm's forearm against the other arm's segments alone.
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    both,
    resolution(),
    ARM_BONES,
  );
  const meets: (side: "left" | "right") => boolean = (
    side: "left" | "right",
  ): boolean => {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const shapes: IAutoMovieMotionHumanColliders.IPlaced[] = HumanArmClearance.obstacles(
      body,
      bones,
      [other],
    ).filter(
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
  const independent: boolean = !meets("left") && !meets("right");
  if (independent && assess === undefined)
    return {
      pose: both,
      seeds,
      values: { left: own.left.value, right: own.right.value },
    };

  // The arms meet: one still configuration of both, drawn to their fits,
  // each hand on its goal, the two arms' probes clear of each other.
  const site: (side: "left" | "right") => M.ISite = (
    side: "left" | "right",
  ): M.ISite => {
    const goal: IAutoMovieHumanLimbGoal = world[side];
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
  const others: IAutoMovieMotionHumanColliders.IPlaced[] = (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieMotionHumanColliders.IPlaced[] => [
      ...(goals[side].clear ?? []),
      ...(goals[side].rests ?? []),
    ],
  );
  const rests: IAutoMovieMotionHumanColliders.IPlaced[] = (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieMotionHumanColliders.IPlaced[] => [...(goals[side].rests ?? [])],
  );
  const base: G.IBase = { pose, others, ...(rests.length === 0 ? {} : { rests }) };
  const sides: readonly ["right", "left"] = ["right", "left"];
  const context: M.IContext = HumanArmTrajectoryContext.of({
    body,
    times: [0, 1, 2],
    bases: [base, base, base],
    arms: sides.map(
      (
        side: "left" | "right",
      ): HumanArmTrajectoryContext.IProblem["arms"][number] => ({
        side,
        rest: arm(pose, side),
        sites: [undefined, site(side), undefined],
        anchor: fits[side],
      }),
    ),
    still: true,
  });
  const start: number[][][] = sides.map(
    (side: "left" | "right", a: number): number[][] => [
      [...context.rest[a]!],
      G.encode(context.setups[a]!, fits[side]),
      [...context.back[a]!],
    ],
  );
  // The segment clearance precheck is conservative. Admission by the
  // complete posed two-arm model is sufficient at this static instant.
  const initial: M.IEvaluation = M.evaluate(context, start);
  if (independent || initial.worst.value <= M.TOLERANCE) {
    assess?.inspect(initial);
    return { pose: both, seeds, values: { left: own.left.value, right: own.right.value } };
  }

  // A free elbow swivel can separate a pair with both hands already on
  // their sites. Keep one arm fixed, fit the other around its actual
  // colliders, and require the same two-arm model before using the pose.
  for (const side of sides) {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const fitted: IAutoMovieSeededChainFit = applyHumanLimbFit(
      body, both, `${side}Arm`, goals[side], [other], world[other].point,
      own[side].seed === null ? near[side] : { ...own[side].seed, tolerance: hingedArmSwivel.RESOLUTION }, resolution,
    );
    const candidate: number[][][] = start.map((frames: number[][], a: number): number[][] =>
      sides[a] === side
        ? [frames[0]!, G.encode(context.setups[a]!, arm(fitted.pose, side)), frames[2]!]
        : frames,
    );
    const checked: M.IEvaluation = M.evaluate(context, candidate);
    if (checked.worst.value <= M.TOLERANCE) {
      assess?.inspect(checked);
      return {
        pose: fitted.pose,
        seeds: { ...seeds, [side]: fitted.seed },
        values: { left: undefined, right: undefined },
      };
    }
  }

  // A speculative posture which no ordinary direct branch admits is a
  // rejected proposal. Only the selected candidate needs the general solve.
  if (assess?.analytic) {
    assess.inspect(initial);
    return { pose: both, seeds, values: { left: own.left.value, right: own.right.value } };
  }

  const result: ReturnType<typeof HumanArmOptimiser.optimise> = HumanArmOptimiser.optimise(
    context,
    start,
  );
  assess?.inspect(result.evaluation);
  let out: IAutoMoviePose = pose;
  sides.forEach((side: "left" | "right", a: number): void => {
    out = HumanArmClearance.posed(
      out,
      side,
      G.arm(context.setups[a]!, result.x[a]![1]!),
    );
  });

  // Each arm's seed is the swivel and branch the coupled solve left it at,
  // the one free parameter of an arm on its goal (Tolani, Goswami and Badler
  // 2000, §3.2.4), so a placement prescribed at it, or between two such
  // solves, reproduces the pair's clear configuration in closed form and
  // needs this solve again only where it does not stay clear.
  return {
    pose: out,
    seeds: {
      left: HumanLimbFit.seed(body, out, "leftArm") ?? seeds.left,
      right: HumanLimbFit.seed(body, out, "rightArm") ?? seeds.right,
    },
    values: { left: undefined, right: undefined },
  };
}

/** Only the two actual arm chains feed the independent-fit mutual-clearance check. */
const ARM_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
  "leftUpperArm", "leftLowerArm", "leftHand", "rightUpperArm", "rightLowerArm", "rightHand",
]);
