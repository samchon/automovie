import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  type IAutoMovieSwivelSeed,
  type IPreparedChainPlant,
  Quaternion,
  Vector3,
  hingedArmSwivel,
  prepareChainPlant,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * A leg posed as the posture's own fit poses it, read through the engine's
 * hinged chain (`hingedArmSwivel`): the knee bends about its hinge alone,
 * and the leg is one bend branch and one swivel about its hip-to-ankle line.
 * `fit` runs the posture's leg fit itself (`HumanLimbFit.remembered`,
 * remembered by its exact inputs) on a pelvis and reads its branch and swivel,
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
   * A leg's bend branch and swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The engine's branch order and swivel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISwivel {
    /** The bend branch, its index in `hingedArmSwivel.branches`. */
    branch: number;

    /** The swivel about the hip-to-ankle line, degrees. */
    swivel: number;
  }

  /**
   * A leg as posed, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation The joints and the two bones' world rotations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPosed {
    /** The hip joint, world metres. */
    hip: IAutoMovieVector3;

    /** The knee, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** The thigh's world rotation. */
    thigh: IAutoMovieQuaternion;

    /** The shank's world rotation. */
    shank: IAutoMovieQuaternion;
  }

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
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    held: ISwivel,
  ): IPosed | null {
    const chain: hingedArmSwivel.IChain = chainOf(
      body,
      side,
      pelvis,
      hip,
      target,
    );
    const stops: hingedArmSwivel.IStop[] | null =
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
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): (target: IAutoMovieVector3, held: ISwivel) => IPosed | null {
    const source: Omit<hingedArmSwivel.IChain, "target" | "range"> =
      sourceOf(body, side, pelvis, hip);
    const geometry: hingedArmSwivel.IPrepared = hingedArmSwivel.prepare(source);
    return (point: IAutoMovieVector3, held: ISwivel): IPosed | null => {
      const target: hingedArmSwivel.IPreparedTarget = geometry.target(point);
      const stops: hingedArmSwivel.IStop[] | null = target.branches();
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
    body: IHumanBody,
    side: "left" | "right",
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): ISwivel {
    const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
    const shank: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
    const chain: hingedArmSwivel.IChain = chainOf(
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
    const stops: hingedArmSwivel.IStop[] = hingedArmSwivel.branches(chain) ?? [
      { theta, shortfall: 0 },
    ];
    const apart = (a: number): number =>
      Math.abs(Math.atan2(Math.sin(a - theta), Math.cos(a - theta)));
    let branch: number = 0;
    stops.forEach((stop: hingedArmSwivel.IStop, i: number): void => {
      if (apart(stop.theta) < apart(stops[branch]!.theta)) branch = i;
    });
    return { branch, swivel: hingedArmSwivel.read(chain, upper, theta) };
  }

  /**
   * The posture's own leg fit (`HumanLimbFit.remembered`, the fit the posture
   * it) on a pelvis, read as a branch and a swivel.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanLimbFit.remembered and read. One invocation-owned lazy resolution reader shares only exact unchanged FK prerequisites between a memory miss and the actual fitted-pose reading; all poses and swivel results remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its reader only through synchronous return or throw; requested maps and snapshots do not enter the returned swivel/seed or body fit memory.
   */
  export function fit(
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): ISwivel {
    return seeded(body, side, pelvis, hip, target, bend, rotation).swivel;
  }

  /**
   * The posture's own leg fit, as `fit`, with the seed that continues it and,
   * given `near`, continuing a nearby fit of the same leg
   * (`HumanLimbFit.remembered`'s `near`): every pass refines that seed
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose of the hips, its remembered fit and a requested four-frame FK feed read; one local lazy reader spans only that synchronous operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is the posture's own, ROM bend search included; a continuation only replaces its sweep with a refinement about the seed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds ordered authored-joint admission and only the hips/thigh/shank/foot ancestor FK to the existing fit cost; unrelated body subtrees are not transformed for the swivel read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses remembered and read; its one local lazy resolution reader shares exact unchanged prerequisites between a fit miss and its actual fitted-pose read, never targets, candidate answers or swivel values.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The invocation releases its FK getter/snapshots and temporary subset map on return or throw; only the actual swivel and seed escape, without retaining an FK reader in memory.
   */
  export function seeded(
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    near?: IAutoMovieSwivelNear,
  ): { swivel: ISwivel; seed: IAutoMovieSwivelSeed | null } {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const restHip: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
    const hips: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: {
        translation: Vector3.subtract(
          hip,
          Quaternion.rotateVector(pelvis, restHip),
        ),
        rotation: pelvis,
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [],
    };

    // The posture's own fit, remembered by its exact inputs as the posture's
    // fits are (`HumanLimbFit.remembered`), so a held leg is not fitted again.
    const fitted: IAutoMovieSeededChainFit = HumanLimbFit.remembered(
      body,
      hips,
      side === "left" ? "leftLeg" : "rightLeg",
      { point: target, bend, rotation },
      [],
      undefined,
      near,
      resolution,
    );
    return {
      swivel: read(
        body,
        side,
        poseBones(body, fitted.pose, resolution(), LEG_BONES[side]),
      ),
      seed: fitted.seed,
    };
  }
  /** The leg's hinged chain at a pelvis toward a target. */
  function chainOf(
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): hingedArmSwivel.IChain {
    return { ...sourceOf(body, side, pelvis, hip), target };
  }

  /** Fixed source fields, independent of ankle targets and held bend choices. */
  function sourceOf(
    body: IHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): Omit<hingedArmSwivel.IChain, "target" | "range"> {
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
    chain: Omit<hingedArmSwivel.IChain, "target" | "range">,
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IPosed {
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
    prepared: IPreparedChainPlant;
    upper: IAutoMovieQuaternion;
    hinge: IAutoMovieVector3;
  }

  /** The leg's chain at rest, read once per body and side. */
  function restOf(body: IHumanBody, side: "left" | "right"): IRest {
    let sides: Map<string, IRest> | undefined = RESTS.get(body);
    if (sides === undefined) {
      sides = new Map();
      RESTS.set(body, sides);
    }
    const known: IRest | undefined = sides.get(side);
    if (known !== undefined) return known;
    const axes: ReturnType<typeof skeletonJointAxes> = skeletonJointAxes(
      body.skeleton,
      HUMANOID_JOINT_AXES,
    );
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    };
    const prepared: IPreparedChainPlant = prepareChainPlant({
      skeleton: body.skeleton,
      pose,
      chain: HumanLimbFit.chain(side === "left" ? "leftLeg" : "rightLeg"),
      topology: body.topology,
      jointAxes: axes,
      restFrames: HUMANOID_REST_FRAME,
    })!;
    const hips: IAutoMovieQuaternion = poseBones(
      body,
      pose,
      undefined,
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
  const RESTS: WeakMap<IHumanBody, Map<string, IRest>> = new WeakMap();

  /** Bone frames consumed by read, with their parent prefixes resolved internally. */
  const LEG_BONES: Readonly<Record<"left" | "right", ReadonlySet<AutoMovieHumanoidBone>>> = {
    left: new Set(["hips", "leftUpperLeg", "leftLowerLeg", "leftFoot"]),
    right: new Set(["hips", "rightUpperLeg", "rightLowerLeg", "rightFoot"]),
  };

  /** The single neutral parent frame required while preparing a leg. */
  const HIPS: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips"]);
}
