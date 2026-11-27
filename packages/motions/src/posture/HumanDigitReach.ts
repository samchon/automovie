import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieHumanDigitGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanGrip,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGrip } from "../handling/HumanGrip";
import { HumanShapeFraming } from "./HumanShapeFraming";
import { poseBones } from "./internal/poseBones";

/**
 * What the digit fit reads of a hand on a posed body (`HumanDigitFit`): its
 * digits' names, the bones of its own hand, how deep its phalanges lie in the
 * body's colliders near it, its phalanges' points and a goal carried from a
 * bone's posed frame into the world.
 */
export namespace HumanDigitReach {
  /** A hand's digits as the rig names them, thumb first. */
  export const DIGIT_NAMES: readonly IAutoMovieMotionHumanGrip.Digit[] = [
    "Thumb",
    "Index",
    "Middle",
    "Ring",
    "Little",
  ];

  /** The bones of a side's own hand, after the side: the hand and its digits. */
  export const OWN: RegExp = /^(Hand|Thumb|Index|Middle|Ring|Little)/;

  /**
   * One hand's unchanged phalanx-depth reduction over a caller-owned body
   * placement.
   */
  export function depthAt(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: AutoMovieHumanSide,
    threshold: number = Infinity,
  ): number {
    const near: IAutoMovieCurlChainUntilContact.ICollider[] = nearBody(
      body,
      bones,
      placed,
      side,
    );
    let deepest: number = -Infinity;
    for (const digit of DIGIT_NAMES) {
      const chain: IAutoMovieCurlChainUntilContact.IChain = HumanGrip.chain(
        body,
        side,
        digit,
      );
      const points: IAutoMovieVector3[] = phalanges(bones, chain);
      for (const collider of near)
        for (let i: number = 1; i < points.length; i++) {
          deepest = Math.max(
            deepest,
            chain.radius -
              physicalShapeSegmentDistance(
                collider.frame,
                collider.shape,
                points[i - 1]!,
                points[i]!,
              ),
          );
          if (deepest > threshold) return deepest;
        }
    }
    return deepest;
  }
  /** The record of `INearBodyBall`'s site. */
  type INearBodyBall = { centre: IAutoMovieVector3; radius: number };

  /**
   * The body's colliders near a hand, in the world: every shape but its own
   * hand's and forearm's whose bounding sphere lies within a hand's length of the
   * hand.
   */
  export const nearBody: (
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: AutoMovieHumanSide,
  ) => IAutoMovieCurlChainUntilContact.ICollider[] = (
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: AutoMovieHumanSide,
  ): IAutoMovieCurlChainUntilContact.ICollider[] => {
    const hand: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
    return placed
      .filter(
        (p: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !p.bone.startsWith(side) ||
          !(OWN.test(p.bone.slice(side.length)) || p.bone === `${side}LowerArm`),
      )
      .flatMap(
        (
          p: IAutoMovieMotionHumanColliders.IPlaced,
        ): IAutoMovieCurlChainUntilContact.ICollider[] =>
          p.shapes
            .filter((shape: IAutoMoviePhysicalShape): boolean => {
              const ball: INearBodyBall = HumanShapeFraming.sphere(p.pose, shape);
              return (
                Vector3.length(Vector3.subtract(ball.centre, hand)) <
                ball.radius + body.measure.hand
              );
            })
            .map(
              (
                shape: IAutoMoviePhysicalShape,
              ): IAutoMovieCurlChainUntilContact.ICollider => ({
                shape,
                frame: p.pose,
              }),
            ),
      );
  };

  /**
   * A digit's phalanges as the points of its joints and its tip, world metres, on
   * posed bones.
   */
  export const phalanges: (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    chain: IAutoMovieCurlChainUntilContact.IChain,
  ) => IAutoMovieVector3[] = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    chain: IAutoMovieCurlChainUntilContact.IChain,
  ): IAutoMovieVector3[] => {
    const points: IAutoMovieVector3[] = chain.bones.map(
      (b: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(b)!.worldPosition,
    );
    const last: IAutoMovieResolvedBone = bones.get(chain.bones.at(-1)!)!;
    points.push(
      Vector3.add(
        last.worldPosition,
        Quaternion.rotateVector(last.worldRotation, chain.tip),
      ),
    );
    return points;
  };
  /** The record of `ICarriedResult`'s site. */
  type ICarriedResult = {
    point: IAutoMovieVector3;
    normal?: IAutoMovieVector3;
  };

  /** The record of `ICarried`'s site. */
  export type ICarried = {
    /** The digit contact point placed in world metres. */
    point: IAutoMovieVector3;

    /** The rotated world normal when the goal specifies one. */
    normal?: IAutoMovieVector3;
  };

  /** A goal's point and normal carried from a bone's posed frame into the world. */
  export const carried: (
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    bone: AutoMovieHumanoidBone,
    goal: IAutoMovieHumanDigitGoal,
    prepared: ReturnType<typeof preparePoseResolution>,
  ) => ICarried = (
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    bone: AutoMovieHumanoidBone,
    goal: IAutoMovieHumanDigitGoal,
    prepared: ReturnType<typeof preparePoseResolution>,
  ): ICarriedResult => {
    const placed: IAutoMovieResolvedBone = poseBones(
      body,
      pose,
      prepared,
      new Set([bone]),
    ).get(bone)!;
    return {
      point: Vector3.add(
        placed.worldPosition,
        Quaternion.rotateVector(placed.worldRotation, goal.point),
      ),
      ...(goal.normal === undefined
        ? {}
        : {
            normal: Quaternion.rotateVector(placed.worldRotation, goal.normal),
          }),
    };
  };

}
