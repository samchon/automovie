import {
  Quaternion,
  Vector3,
  hingedArmSwivel,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedChainGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLegChain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanLegSeededFit } from "./prepareHumanLegSeededFit";

/**
 * A leg posed as the posture's own fit poses it, read through the engine's
 * hinged chain (`hingedArmSwivel`): the knee bends about its hinge alone, and
 * the leg is one bend branch and one swivel about its hip-to-ankle line. `fit`
 * runs the posture's leg fit itself (`applyHumanLimbFit`, solved directly every
 * time) on a pelvis and reads its branch and swivel, and `seeded` does so
 * continuing a nearby fit's seed; `pose` places the leg from a held branch and
 * swivel for any ankle, so a planner that holds them between fits poses the
 * very knee the fit does wherever its swivel is the fit's; `read` takes them
 * from shown bones.
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
   */
  export function pose(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
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
   * Prepare a leg poser for several targets under one unchanged pelvis and hip
   * point. The body, pelvis quaternion and hip coordinates remain fixed until
   * the caller releases the reader. Each target independently chooses the held
   * branch (or the last branch available) and the held swivel; no prior pose,
   * target or continuation seed becomes another request's input.
   *
   * @param body The canonical immutable body.
   * @param side The leg.
   * @param pelvis Fixed model-frame pelvis rotation.
   * @param hip Fixed model-metre hip point.
   * @returns An actual leg poser for each model-metre target and held swivel.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): (
    target: IAutoMovieVector3,
    held: IAutoMovieMotionHumanLegChain.ISwivel,
  ) => IAutoMovieMotionHumanLegChain.IPosed | null {
    const source: Omit<IAutoMovieHingedChainGeometry, PrepareSource> = sourceOf(
      body,
      side,
      pelvis,
      hip,
    );
    const geometry: hingedArmSwivel.IPrepared = hingedArmSwivel.prepare(source);
    return (
      point: IAutoMovieVector3,
      held: IAutoMovieMotionHumanLegChain.ISwivel,
    ): IAutoMovieMotionHumanLegChain.IPosed | null => {
      const target: hingedArmSwivel.IPreparedTarget = geometry.target(point);
      const stops: IAutoMovieHingedArmSwivel.IStop[] | null = target.branches();
      if (stops === null) return null;
      const theta: number =
        stops[Math.min(held.branch, stops.length - 1)]!.theta;
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
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
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
   * The posture's own leg fit (`applyHumanLimbFit`, the fit a resolve runs) on
   * a pelvis, read as a branch and a swivel.
   *
   * @param body The body.
   * @param side The leg.
   * @param pelvis The pelvis's world rotation.
   * @param hip The hip joint, world metres.
   * @param target The ankle's target, world metres.
   * @param bend The point the knee bends toward, world metres.
   * @param rotation The foot's world rotation.
   * @returns The fit's branch and swivel.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
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
   * (`applyHumanLimbFit`'s `near`): every pass refines that seed instead of
   * sweeping the swivel, so a fit of inputs a small step from a fitted leg's
   * costs a refinement, not a sweep.
   *
   * @param body The body.
   * @param side The leg.
   * @param pelvis The pelvis's world rotation.
   * @param hip The hip joint, world metres.
   * @param target The ankle's target, world metres.
   * @param bend The point the knee bends toward, world metres.
   * @param rotation The foot's world rotation.
   * @param near A nearby fit of the same leg to continue; cold when absent.
   * @returns The fit's branch and swivel, and its seed (null when the fit's
   *   answer is not a hinged candidate).
   */
  export function seeded(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
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
   */
  export function prepareSeeded(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): ReturnType<typeof prepareHumanLegSeededFit> {
    return prepareHumanLegSeededFit(
      body,
      side,
      pelvis,
      hip,
      (
        bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ): IAutoMovieMotionHumanLegChain.ISwivel => read(body, side, bones),
    );
  }
  /** The leg's hinged chain at a pelvis toward a target. */
  function chainOf(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): IAutoMovieHingedChainGeometry {
    return { ...sourceOf(body, side, pelvis, hip), target };
  }

  /** Fixed source fields, independent of ankle targets and held bend choices. */
  function sourceOf(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
  ): Omit<IAutoMovieHingedChainGeometry, SourceOfResult> {
    const rest: NonNullable<IAutoMovieMotionHumanBody["chains"]["leftLeg"]> =
      restOf(body, side);
    return {
      upper: {
        worldPosition: hip,
        worldRotation: Quaternion.multiply(pelvis, rest.upperRotation),
      },
      midOffset: rest.lowerOffset,
      midRest: rest.lowerRotation,
      endOffset: rest.effectorOffset,
      hinge: rest.hinge,
    };
  }

  /** Actual leg FK shared by ordinary and fixed-source posing. */
  function placed(
    chain: Omit<IAutoMovieHingedChainGeometry, PlacedChain>,
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IAutoMovieMotionHumanLegChain.IPosed {
    const thigh: IAutoMovieQuaternion = Quaternion.multiply(
      chain.upper.worldRotation,
      upper,
    );
    const hip: IAutoMovieVector3 = chain.upper.worldPosition;
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
   * A leg's chain at rest, from the body's prepared chain constants
   * (`IAutoMovieMotionHumanBody.chains`): the hip bone's rest frame under the
   * hips, the knee and ankle's rest places and turns, and the knee's hinge.
   */
  function restOf(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): NonNullable<IAutoMovieMotionHumanBody["chains"]["leftLeg"]> {
    const constants: IAutoMovieMotionHumanBody["chains"]["leftLeg"] =
      body.chains[side === "left" ? "leftLeg" : "rightLeg"];
    if (constants === undefined)
      throw new Error(`The rig has no ${side} leg chain`);
    return constants;
  }
}

/** The alternatives of `PlacedChain`'s site. */
type PlacedChain = "target" | "range";

/** The alternatives of `SourceOfResult`'s site. */
type SourceOfResult = "target" | "range";

/** The alternatives of `PrepareSource`'s site. */
type PrepareSource = "target" | "range";
