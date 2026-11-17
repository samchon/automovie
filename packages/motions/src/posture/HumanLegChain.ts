import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  hingedArmSwivel,
  prepareChainPlant,
  resolveBoneMap,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHingedArmSwivel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLegChain,
  IAutoMoviePose,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";

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
    const chain: IAutoMovieHingedArmSwivel.IChain = chainOf(
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
    const { upper, lower } = hingedArmSwivel.pose(chain, theta)(held.swivel);
    const thigh: IAutoMovieQuaternion = Quaternion.multiply(
      chain.upper.worldRotation,
      upper,
    );
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Quaternion.rotateVector(thigh, chain.midOffset),
    );
    const shank: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(thigh, chain.midRest),
      lower,
    );
    return {
      hip,
      knee,
      ankle: Vector3.add(knee, Quaternion.rotateVector(shank, chain.endOffset)),
      thigh,
      shank,
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
    const chain: IAutoMovieHingedArmSwivel.IChain = chainOf(
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
    const stops: IAutoMovieHingedArmSwivel.IStop[] = hingedArmSwivel.branches(
      chain,
    ) ?? [{ theta, shortfall: 0 }];
    const apart = (a: number): number =>
      Math.abs(Math.atan2(Math.sin(a - theta), Math.cos(a - theta)));
    let branch: number = 0;
    stops.forEach((stop: IAutoMovieHingedArmSwivel.IStop, i: number): void => {
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose of the hips, the fit, the bones, the reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is the posture's own, ROM bend search included.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanLimbFit.remembered`, whose memory reads a fit of the same inputs again, and `read`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pose of the hips, the fit, the bones, the reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fit is the posture's own, ROM bend search included; a continuation only replaces its sweep with a refinement about the seed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanLimbFit.remembered`, whose memory reads a fit of the same inputs again, and `read`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    );
    return {
      swivel: read(
        body,
        side,
        resolveBoneMap(
          body.skeleton,
          fitted.pose,
          body.topology,
          skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES),
          HUMANOID_REST_FRAME,
        ),
      ),
      seed: fitted.seed,
    };
  }
  /** The leg's hinged chain at a pelvis toward a target. */
  function chainOf(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): IAutoMovieHingedArmSwivel.IChain {
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
      target,
    };
  }

  /** A leg's chain at rest: its preparation, the hip bone's frame under the hips and the knee's hinge in its own frame. */
  interface IRest {
    prepared: IAutoMoviePreparedChainPlant;
    upper: IAutoMovieQuaternion;
    hinge: IAutoMovieVector3;
  }

  /** The leg's chain at rest, read once per body and side. */
  function restOf(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
  ): IRest {
    let sides: Map<string, IRest> | undefined = RESTS.get(body);
    if (sides === undefined) {
      sides = new Map();
      RESTS.set(body, sides);
    }
    const known: IRest | undefined = sides.get(side);
    if (known !== undefined) return known;
    const axes = skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    };
    const prepared: IAutoMoviePreparedChainPlant = prepareChainPlant({
      skeleton: body.skeleton,
      pose,
      chain: HumanLimbFit.chain(side === "left" ? "leftLeg" : "rightLeg"),
      topology: body.topology,
      jointAxes: axes,
      restFrames: HUMANOID_REST_FRAME,
    })!;
    const hips: IAutoMovieQuaternion = resolveBoneMap(
      body.skeleton,
      pose,
      body.topology,
      axes,
      HUMANOID_REST_FRAME,
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
  const RESTS: WeakMap<
    IAutoMovieMotionHumanBody,
    Map<string, IRest>
  > = new WeakMap();
}
