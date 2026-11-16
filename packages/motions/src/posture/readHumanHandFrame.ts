import { type IAutoMovieResolvedBone, Quaternion, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";

/**
 * Read a hand surface using its actual body-declared digit region bone.
 * HumanHand owns surface classification and local offset construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual world-bone input, lazy offset order, digital-region lookup and fresh frame/dependency ownership; preparePoint binds fixed non-digit local point geometry while digital requests retain their complete original frame path.
 * @evidence contracts/development/implementation.md#principled-implementation Non-digit surfaces ride the hand rigidly; digit point/normal ride their body-declared region bone while forward remains hand-carried. The bones companion names those same map lookups, including custom/fallback regions, without assuming a canonical distal bone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local-frame read and actual region lookup serve frame seating/bone demand; worldPoint owns identical cold/prepared non-digit point arithmetic, and digital point preparation delegates unchanged full frame seating.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No canonical distal-name assumption replaces custom/fallback region metadata. Hand lookup precedes local offset evaluation, and digit seating follows it in the original order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Full frames retain constant rigid/map work; prepared non-digit points read their offset once and omit two unused world direction rotations and the full frame wrapper. Every actual point still transforms normally; digital requests keep their original cost and dependency lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Frame reading and bones share the actual region owner. A fixed body/side/surface/form point reader snapshots its local point only, never a posed frame; changed fixed geometry requires another producer and every current world transform remains actual.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold frame/bone reads retain nothing. A prepared point reader owns one fixed local vector and original fixed geometry callback until release; digital fallback borrows original body/geometry. Returned points/maps/frames remain fresh with no current bones, time, result history, handle or task retained.
 */
export function readHumanHandFrame(
  body: IHumanBody,
  bones: Bones,
  side: HumanHand.Side,
  surface: HumanHand.Surface,
  offset: () => HumanHand.IFrame,
  digital: boolean,
): HumanHand.IFrame {
  const hand: WorldBone = bones.get(`${side}Hand`)!;
  const local: HumanHand.IFrame = offset();
  const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 =
    (v: IAutoMovieVector3): IAutoMovieVector3 => Quaternion.rotateVector(hand.worldRotation, v);
  if (!digital) return { point: worldPoint(hand.worldPosition, local.point, hand.worldRotation),
    normal: turn(local.normal), forward: turn(local.forward) };
  const actual: resolveAutoMovieHumanoidSurfaces.IFrame = region(body, side, surface);
  const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
    resolveAutoMovieHumanoidSurfaces.place(actual, bones.get(actual.bone)!);
  return { point: placed.point, normal: placed.normal, forward: turn(local.forward) };
}

/**
 * Exact world-bone demand and fixed point geometry of a hand-surface read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines hand/actual-region bone demand, fresh dependency sets, prepared non-digit local point lifetime and complete digital fallback.
 * @evidence contracts/development/design.md#principled-representation Full frames need hand-forward rotation and actual digital-region seating; fixed non-digit point reads need only their local point and current hand transform.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dependency query supports scoped FK, while prepared points serve actual Demand/relay consumers; HumanHand retains surface classification and local geometry ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same actual region lookup as seating, including custom/fallback region bones.
 */
export namespace readHumanHandFrame {
  /**
   * Prepare a point-only read for fixed admitted body/side/surface/form geometry.
   * The first non-digit read looks up the hand before acquiring/copying its
   * offset, then each actual bones map produces one fresh world point through
   * the same cold numerical owner. No normal/forward world rotations run.
   * Digital surfaces retain the complete original frame path, including current
   * actual region/custom-bone lookup, offset order and hand-forward behavior.
   * Release this fixed local-point reader with its owner; it keeps no pose,
   * bones map, queried time, world point or result history.
   */
  export function preparePoint(body: IHumanBody, side: HumanHand.Side,
    surface: HumanHand.Surface, offset: () => HumanHand.IFrame, digital: boolean):
    (bones: Bones) => IAutoMovieVector3 {
    if (digital) return (bones: Bones): IAutoMovieVector3 =>
      readHumanHandFrame(body, bones, side, surface, offset, true).point;
    let local: IAutoMovieVector3 | undefined;
    return (bones: Bones): IAutoMovieVector3 => {
      const hand: WorldBone = bones.get(`${side}Hand`)!;
      if (local === undefined) {
        const point: IAutoMovieVector3 = offset().point;
        local = { x: point.x, y: point.y, z: point.z };
      }
      return worldPoint(hand.worldPosition, local, hand.worldRotation);
    };
  }

  /**
   * Request precisely the frames the same surface read consumes.
   *
   * The boolean is HumanHand.digital's result for this surface; output is a fresh set containing hand and any actual digital-region bone.
   * The returned dependency names mirror the numerical frame reader's actual map lookups.
   * One hand insertion and the same optional region lookup avoid duplicating region-bone policy in consumers.
   * No pose, guessed distal bone, default region or unrelated body frame substitutes for declared geometry.
   * Constant lookup and at most two set entries without FK or a body traversal.
   * The query coordinates no retained work.
   * Returns a fresh caller-owned set and retains no body or metadata.
   */
  export function bones(body: IHumanBody, side: HumanHand.Side, surface: HumanHand.Surface,
    digital: boolean): ReadonlySet<AutoMovieHumanoidBone> {
    const requested: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    if (digital) requested.add(region(body, side, surface).bone);
    return requested;
  }
}

/** Current rigid world frames read by both complete and point-only hand queries. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, WorldBone>;

/** The two current world transform values used by hand-surface seating. */
type WorldBone = Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">;

/** Preserve cold point arithmetic and its position/local-point/rotation argument order. */
function worldPoint(position: IAutoMovieVector3, point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion): IAutoMovieVector3 {
  return Vector3.add(position, Quaternion.rotateVector(rotation, point));
}

/** Preserve the original body-owned digital surface key and its actual bone. */
function region(body: IHumanBody, side: HumanHand.Side,
  surface: HumanHand.Surface): resolveAutoMovieHumanoidSurfaces.IFrame {
  return body.surfaces.regions[
    `${surface}${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
  ];
}
