import {
  DEFAULT_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  hingedArmSwivel,
  prepareChainPlant,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLegChain,
  IAutoMoviePose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { poseBones } from "./poseBones";
import { prepareHumanLegSeededFit } from "./prepareHumanLegSeededFit";

/**
 * A leg posed as the posture's own fit poses it, read through the engine's
 * hinged chain (`hingedArmSwivel`): the knee bends about its hinge alone,
 * and the leg is one bend branch and one swivel about its hip-to-ankle line.
 * `fit` runs the posture's leg fit itself (`applyHumanLimbFit`, solved
 * directly every time) on a pelvis and reads its branch and swivel,
 * and `seeded` does so continuing a nearby fit's seed;
 * `pose` places the leg from a held branch and swivel for any ankle, so a
 * planner that holds them between fits poses the very knee the fit does
 * wherever its swivel is the fit's; `read` takes them from shown bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the representation, the three readings and what a held swivel guarantees.
 * @evidence contracts/development/design.md#principled-representation The swivel parameterisation of Tolani, Goswami and Badler 2000, as the engine's hinged chain owns it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The swivel, the posed leg and four functions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The knee is never placed by a model of its own: the fit is the posture's, the posing and the reading the engine's.
 */
export namespace HumanLegChain {
  /**
   * The leg posed from a held branch and swivel, its ankle at a target.
   *
   * @param body The body.
   * @param side The leg.
   * @param pelvis The pelvis's world rotation, the hip joints' frame.
   * @param hip The hip joint, world metres.
   * @param target The ankle's target, world metres.
   * @param held The branch and swivel.
   * @returns The leg, or null for a degenerate chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's branches and posing at the hip's frame under the pelvis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chain, the branch, the pose, then the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A branch the target no longer offers falls to the last one there is.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `hingedArmSwivel` and the leg's rest chain, read once per body.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh leg.
   */
  export function pose(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    held: IAutoMovieMotionHumanLegChain.ISwivel,
  ): IAutoMovieMotionHumanLegChain.IPosed | null {
    const chain: IAutoMovieHingedChainGeometry = chainOf(
      body,
      side,
      pelvis,
      hip,
      target,
    );
    const stops: IAutoMovieHingedArmSwivel.IStop[] | null =
      hingedArmSwivel.branches(chain);
    if (stops === null) return null;
    const theta: number = stops[Math.min(held.branch, stops.length - 1)]!.theta;
    const rotations: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
      hingedArmSwivel.pose(chain, theta)(held.swivel);
    return placed(chain, rotations.upper, rotations.lower);
  }

  /**
   * Prepare a leg poser for several targets under one unchanged pelvis and
   * hip point. The body, pelvis quaternion and hip coordinates remain fixed
   * until the caller releases the reader. Each target independently chooses
   * the held branch (or the last branch available) and the held swivel; no
   * prior pose, target or continuation seed becomes another request's input.
   *
   * @param body The canonical immutable body.
   * @param side The leg.
   * @param pelvis Fixed model-frame pelvis rotation.
   * @param hip Fixed model-metre hip point.
   * @returns An actual leg poser for each model-metre target and held swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged source scope, model-metre targets, held-branch fallback, independent target semantics and caller release.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's exact hinge-span/source-frame preparation serves a fixed leg root; each target still solves the actual hinge roots and branch aim before the same two-stage FK used by pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure sourceOf owns fixed leg geometry, hingedArmSwivel owns roots/aim/swivel and placed owns the shared actual leg frames; this reader adds no IK or scoring policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target is replaced by a reached point, no fit/seed is remembered, and original branch order/fallback and geometric-shell behavior remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed root composition and lazy constant hinge sinusoid/inverse serve all targets. Each query still performs constant root/branch/aim/FK work; runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's fixed body/pelvis/hip prove source equivalence, so only source geometry is shared across the bow search's targets. Actual target roots, selected branch/swivel and returned points are computed independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One returned closure borrows body-derived source and hip plus one bounded engine preparation until caller release; target readers and generated frames end with each query and no target history or handles are retained.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): (target: IAutoMovieVector3, held: IAutoMovieMotionHumanLegChain.ISwivel) => IAutoMovieMotionHumanLegChain.IPosed | null {
    const source: Omit<IAutoMovieHingedChainGeometry, "target" | "range"> =
      sourceOf(body, side, pelvis, hip);
    const geometry: hingedArmSwivel.IPrepared = hingedArmSwivel.prepare(source);
    return (point: IAutoMovieVector3, held: IAutoMovieMotionHumanLegChain.ISwivel): IAutoMovieMotionHumanLegChain.IPosed | null => {
      const target: hingedArmSwivel.IPreparedTarget = geometry.target(point);
      const stops: IAutoMovieHingedArmSwivel.IStop[] | null = target.branches();
      if (stops === null) return null;
      const theta: number = stops[Math.min(held.branch, stops.length - 1)]!.theta;
      const rotations: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
        target.pose(theta)(held.swivel);
      return placed(source, rotations.upper, rotations.lower);
    };
  }

  /**
   * The branch and swivel of a leg as shown.
   *
   * @param body The body.
   * @param side The leg.
   * @param bones The shown bones, world frame.
   * @returns The branch and swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's and the shank's rotations taken back to the hinge angle and the swivel `pose` reads them by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chain at the shown ankle, the bone-local rotations, the nearest branch, the swivel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The branch is the one whose hinge angle is nearest the shown one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `hingedArmSwivel.read`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanLegChain.ISwivel {
    const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
    const shank: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
    const chain: IAutoMovieHingedChainGeometry = chainOf(
      body,
      side,
      bones.get("hips")!.worldRotation,
      thigh.worldPosition,
      bones.get(`${side}Foot`)!.worldPosition,
    );
    const upper: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(chain.upper.worldRotation),
      thigh.worldRotation,
    );
    const lower: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(
        Quaternion.multiply(thigh.worldRotation, chain.midRest),
      ),
      shank.worldRotation,
    );
    const hinge: IAutoMovieVector3 = Vector3.normalize(chain.hinge);
    const theta: number =
      2 *
      Math.atan2(
        lower.x * hinge.x + lower.y * hinge.y + lower.z * hinge.z,
        lower.w,
      );
    const stops: IAutoMovieHingedArmSwivel.IStop[] = hingedArmSwivel.branches(chain) ?? [
      { theta, shortfall: 0 },
    ];
    const apart = (a: number): number =>
      Math.abs(Math.atan2(Math.sin(a - theta), Math.cos(a - theta)));
    let branch: number = 0;
    stops.forEach((stop: IAutoMovieHingedArmSwivel.IStop, i: number): void => {
      if (apart(stop.theta) < apart(stops[branch]!.theta)) branch = i;
    });
    return { branch, swivel: hingedArmSwivel.read(chain, upper, theta) };
  }

  /**
   * The posture's own leg fit (`applyHumanLimbFit`, the fit a resolve
   * runs) on a pelvis, read as a branch and a swivel.
   *
   * @param body The body.
   * @param side The leg.
   * @param pelvis The pelvis's world rotation.
   * @param hip The hip joint, world metres.
   * @param target The ankle's target, world metres.
   * @param bend The point the knee bends toward, world metres.
   * @param rotation The foot's world rotation.
   * @returns The fit's branch and swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The posture's fit, run on the hips alone: a leg's fit reads nothing above its hip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose of the hips, the fit and its four requested bone frames feed the existing swivel reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is the posture's own, ROM bend search included.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds ordered authored-joint admission plus only the requested hips/thigh/shank/foot ancestor FK to the existing fit cost; unrelated body subtrees are not transformed for the swivel read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses applyHumanLimbFit (the direct solve) and read. One invocation-owned lazy resolution reader shares only exact unchanged FK prerequisites between the solve and the actual fitted-pose reading; all poses and swivel results remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its reader only through synchronous return or throw; requested maps and snapshots do not enter the returned swivel/seed.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieMotionHumanLegChain.ISwivel {
    return seeded(body, side, pelvis, hip, target, bend, rotation).swivel;
  }

  /**
   * The posture's own leg fit, as `fit`, with the seed that continues it and,
   * given `near`, continuing a nearby fit of the same leg
   * (`applyHumanLimbFit`'s `near`): every pass refines that seed
   * instead of sweeping the swivel, so a fit of inputs a small step from a
   * fitted leg's costs a refinement, not a sweep.
   *
   * @param body The body.
   * @param side The leg.
   * @param pelvis The pelvis's world rotation.
   * @param hip The hip joint, world metres.
   * @param target The ankle's target, world metres.
   * @param bend The point the knee bends toward, world metres.
   * @param rotation The foot's world rotation.
   * @param near A nearby fit of the same leg to continue; cold when absent.
   * @returns The fit's branch and swivel, and its seed (null when the fit's answer is not a hinged candidate).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the continuation and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The posture's fit run on the hips alone, continued from a nearby seed where one is given, its warm start (`IAutoMovieSwivelNear`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose of the hips, its directly solved fit and a requested four-frame FK feed read; one local lazy reader spans only that synchronous operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is the posture's own, ROM bend search included; a continuation only replaces its sweep with a refinement about the seed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds ordered authored-joint admission and only the hips/thigh/shank/foot ancestor FK to the existing fit cost; unrelated body subtrees are not transformed for the swivel read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the direct solve and read; its one local lazy resolution reader shares exact unchanged prerequisites between the solve and its actual fitted-pose read, never targets, candidate answers or swivel values.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The invocation releases its FK getter/snapshots and temporary subset map on return or throw; only the actual swivel and seed escape.
   */
  export function seeded(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieMotionHumanLegChain.ISeededResult {
    return prepareSeeded(body, side, pelvis, hip)(target, bend, rotation, near);
  }

  /**
   * Prepare a fixed hips-only leg source for changing complete goal requests.
   * Body, pelvis and hip stay unchanged until this synchronous piece ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed model-frame pelvis/hip, changing target/bend/rotation/near and caller-owned piece lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The existing hips-only root is constant for fixed pelvis/hip; each query still executes the directly solved limb fit and reads its actual shown branch/swivel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareHumanLegSeededFit owns fixed construction/reader, HumanLimbFit owns every actual solve and read owns swivel extraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No target, bend, rotation or near seed is substituted or cached; the mirror and root-frame conventions remain with the solve's owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed root and bounded exact FK workspace serve repeated coordinate probes. Its actual local reader also lends matching source geometry/rig preparation across solves; every query retains its actual solve and current four-frame FK. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed source scalars and exact FK prerequisites are shared; the source owner additionally snapshots and checks the complete normalized/mirrored source before reusing only preparation. Changed goals/near remain actual query inputs and changed body/pelvis/hip require new preparation; no fitted result is lent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One piece owns fixed source/root and bounded reader state until release; temporary fitted maps end per query and no fitted answer, target history or handle is retained here.
   */
  export function prepareSeeded(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): ReturnType<typeof prepareHumanLegSeededFit> {
    return prepareHumanLegSeededFit(body, side, pelvis, hip,
      (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): IAutoMovieMotionHumanLegChain.ISwivel =>
        read(body, side, bones));
  }
  /** The leg's hinged chain at a pelvis toward a target. */
  function chainOf(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): IAutoMovieHingedChainGeometry {
    return { ...sourceOf(body, side, pelvis, hip), target };
  }

  /** Fixed source fields, independent of ankle targets and held bend choices. */
  function sourceOf(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): Omit<IAutoMovieHingedChainGeometry, "target" | "range"> {
    const rest: IRest = restOf(body, side);
    return {
      upper: {
        worldPosition: hip,
        worldRotation: Quaternion.multiply(pelvis, rest.upper),
      },
      midOffset: rest.prepared.lowerOffset,
      midRest: rest.prepared.lowerRotation,
      endOffset: rest.prepared.effectorOffset,
      hinge: rest.hinge,
    };
  }

  /** Actual leg FK shared by ordinary and fixed-source posing. */
  function placed(
    chain: Omit<IAutoMovieHingedChainGeometry, "target" | "range">,
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IAutoMovieMotionHumanLegChain.IPosed {
    const thigh: IAutoMovieQuaternion = Quaternion.multiply(chain.upper.worldRotation, upper);
    const hip: IAutoMovieVector3 = chain.upper.worldPosition;
    const knee: IAutoMovieVector3 = Vector3.add(hip,
      Quaternion.rotateVector(thigh, chain.midOffset));
    const shank: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(thigh, chain.midRest), lower);
    return { hip, knee, ankle: Vector3.add(knee,
      Quaternion.rotateVector(shank, chain.endOffset)), thigh, shank };
  }

  /** A leg's chain at rest: its preparation, the hip bone's frame under the hips and the knee's hinge in its own frame. */
  interface IRest {
    prepared: IAutoMoviePreparedChainPlant;
    upper: IAutoMovieQuaternion;
    hinge: IAutoMovieVector3;
  }

  /**
   * Read actual rest geometry once per immutable body/side. The body's static
   * axes/neutral FK serve chain and hips under one local operation key; that
   * reader ends here and only the original geometric record enters RESTS.
   */
  function restOf(body: IAutoMovieMotionHumanBody, side: "left" | "right"): IRest {
    let sides: Map<string, IRest> | undefined = RESTS.get(body);
    if (sides === undefined) {
      sides = new Map();
      RESTS.set(body, sides);
    }
    const known: IRest | undefined = sides.get(side);
    if (known !== undefined) return known;
    const axes: IAutoMovieMotionHumanBody["poseResolution"]["jointAxes"] = body.poseResolution.jointAxes;
    const resolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    };
    const prepared: IAutoMoviePreparedChainPlant = prepareChainPlant(
      {
        skeleton: body.skeleton,
        pose,
        chain: HumanLimbFit.chain(side === "left" ? "leftLeg" : "rightLeg"),
        topology: body.topology,
        jointAxes: axes,
        restFrames: HUMANOID_REST_FRAME,
      },
      resolution,
      body.poseResolution,
    )!;
    const hips: IAutoMovieQuaternion = poseBones(
      body,
      pose,
      resolution,
      HIPS,
    ).get("hips")!.worldRotation;
    const out: IRest = {
      prepared,
      upper: Quaternion.multiply(
        Quaternion.inverse(hips),
        prepared.upper.worldRotation,
      ),
      hinge: (axes[`${side}LowerLeg`] ?? DEFAULT_JOINT_AXES).flexion,
    };
    sides.set(side, out);
    return out;
  }

  /** Each body's legs at rest (`restOf`). */
  const RESTS: WeakMap<IAutoMovieMotionHumanBody, Map<string, IRest>> = new WeakMap();

  /** The single neutral parent frame required while preparing a leg. */
  const HIPS: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips"]);
}
