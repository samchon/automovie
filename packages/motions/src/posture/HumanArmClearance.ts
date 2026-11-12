import {
  type IAutoMovieResolvedBone,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "./HumanColliders";

/**
 * The room a forearm needs beside its own trunk.
 *
 * A hand goal fixes the wrist and leaves the elbow free on a circle. An
 * elbow place whose point is outside the trunk can still run the forearm
 * through it, so the forearm is judged along its whole length: its axis,
 * sampled from the elbow toward the wrist, keeps the forearm's radius from
 * the colliders of the trunk, the neck and the head at the elbow, tapering to
 * the wrist's own clearance at the wrist, where the palm lies on the surface
 * the hand was sent to. The limb fit, which places the legs before the arms,
 * judges the thighs too (`obstacles`); a caller that poses only the trunk
 * judges the trunk alone (`trunk`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, against which colliders, the taper and which caller judges the thighs.
 * @evidence contracts/development/design.md#principled-representation A capsule of linearly tapering radius against the body's own profile colliders, the shapes every contact verdict measures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions: the trunk's placed colliders, those with the thighs, and a forearm's overshoot; the single owner of forearm clearance, read by the bend solver and by every arm fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the body's measured forearm radius and the colliders are the profile's; no margin is added and no law is named.
 */
export namespace HumanArmClearance {
  /**
   * The colliders a forearm may not enter, placed by a pose's bones.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame; only the trunk's are read.
   * @returns The placed segments of the hips, the spine, the chest, the neck and the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what is read.
   * @evidence contracts/development/implementation.md#principled-implementation Placement is `HumanColliders.placed`, the single owner; this function only keeps the trunk's segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trunk(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): HumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones).filter(
      (segment: HumanColliders.IPlaced): boolean => TRUNK.has(segment.bone),
    );
  }

  /**
   * The colliders a forearm may not enter in a pose whose legs are placed:
   * the trunk's and both thighs'.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame, the legs where the pose puts them.
   * @returns The placed segments of `trunk` and of the two upper legs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which segments are returned and what the pose must already hold.
   * @evidence contracts/development/implementation.md#principled-implementation A hand sent to a thigh, or past one, bends its elbow away from the thigh as it does from the ribs; the limb fit places the legs before the arms, so the thighs stand where the posture puts them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shanks and feet are left out: a forearm reaches them only with the hand, which the taper leaves to its goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the profile's segments.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function obstacles(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): HumanColliders.IPlaced[] {
    return HumanColliders.placed(body, bones).filter(
      (segment: HumanColliders.IPlaced): boolean =>
        TRUNK.has(segment.bone) ||
        segment.bone === "leftUpperLeg" ||
        segment.bone === "rightUpperLeg",
    );
  }

  /**
   * How far a forearm lies inside the room it needs, as degrees of upper arm
   * turn, the unit a range of motion overshoot has.
   *
   * @param body The body, for the forearm's radius and the upper arm's length.
   * @param shapes The trunk's placed colliders (`trunk`).
   * @param elbow The elbow, world metres.
   * @param wrist The wrist, world metres.
   * @returns Degrees; 0 when the forearm clears the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, each input's frame and the meaning of 0.
   * @evidence contracts/development/implementation.md#principled-implementation The deepest of `SAMPLES` axis points below its needed clearance, the forearm's radius at the elbow falling linearly to the wrist's own signed clearance (0 for a wrist outside the body), divided by the upper arm's length: the angle the upper arm turns to carry the elbow that far.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exact segment query per shape, then the samples of the near shapes only.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wrist end asks no more than the goal itself gives, so a palm laid on the trunk is not refused; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms A forearm whose axis is a radius from every shape costs one segment query per shape; only a shape nearer than that is sampled.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every distance is the engine's `physicalShapeSegmentDistance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function overshoot(
    body: IHumanBody,
    shapes: readonly HumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
  ): number {
    const radius: number = body.measure.forearmRadius;
    const near: IShape[] = [];
    for (const segment of shapes)
      for (const shape of segment.shapes)
        if (
          physicalShapeSegmentDistance(segment.pose, shape, elbow, wrist) <
          radius
        )
          near.push({ pose: segment.pose, shape });
    if (near.length === 0) return 0;

    // The wrist's own signed clearance when the goal puts it inside a shape,
    // which no elbow place changes; 0 for a wrist outside the body.
    let grazing: number = 0;
    for (const { pose, shape } of near)
      grazing = Math.min(
        grazing,
        physicalShapeSegmentDistance(pose, shape, wrist, wrist),
      );
    let depth: number = 0;
    for (let i: number = 0; i < SAMPLES; i++) {
      const s: number = i / SAMPLES;
      const at: IAutoMovieVector3 = Vector3.lerp(elbow, wrist, s);
      const needed: number = radius * (1 - s) + grazing * s;
      for (const { pose, shape } of near)
        depth = Math.max(
          depth,
          needed - physicalShapeSegmentDistance(pose, shape, at, at),
        );
    }
    return ((depth / body.measure.upperArm) * 180) / Math.PI;
  }
}

/** One shape with the posed frame of its segment. */
interface IShape {
  /** The segment's posed frame. */
  pose: HumanColliders.IPlaced["pose"];

  /** The shape. */
  shape: HumanColliders.IPlaced["shapes"][number];
}

/** The bones whose colliders a forearm may not enter. */
const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
  ]);

/** The intervals a forearm's axis is sampled in, from the elbow to short of the wrist. */
const SAMPLES: number = 8;
