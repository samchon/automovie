import { type IAutoMovieResolvedBone, Quaternion, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";

/**
 * Read a hand surface using its actual body-declared digit region bone.
 * HumanHand owns surface classification and local offset construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual world-bone input, lazy offset order, digital-region lookup, fresh frame ownership and bones' fresh dependency set containing hand plus the declared digital-region bone.
 * @evidence contracts/development/implementation.md#principled-implementation Non-digit surfaces ride the hand rigidly; digit point/normal ride their body-declared region bone while forward remains hand-carried. The bones companion names those same map lookups, including custom/fallback regions, without assuming a canonical distal bone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local-frame read and one shared actual region lookup serve frame seating and its demanded-bone companion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No canonical distal-name assumption replaces custom/fallback region metadata. Hand lookup precedes local offset evaluation, and digit seating follows it in the original order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant rigid arithmetic/map lookups read a frame; bones performs one hand insertion and at most one region lookup/insertion, letting scoped FK compute only those frames/ancestors without a body scan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Frame reading and bones use the same actual region owner, with no guessed region, frame/result cache or body identity memo; each call reads current inputs independently.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Neither entry point retains callback/map/body metadata; outputs are fresh numeric frame values or a caller-owned at-most-two-entry name set, with no handle or task.
 */
export function readHumanHandFrame(
  body: IHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">>,
  side: HumanHand.Side,
  surface: HumanHand.Surface,
  offset: () => HumanHand.IFrame,
  digital: boolean,
): HumanHand.IFrame {
  const hand: Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation"> = bones.get(`${side}Hand`)!;
  const local: HumanHand.IFrame = offset();
  const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 =
    (v: IAutoMovieVector3): IAutoMovieVector3 => Quaternion.rotateVector(hand.worldRotation, v);
  if (!digital) return { point: Vector3.add(hand.worldPosition, turn(local.point)),
    normal: turn(local.normal), forward: turn(local.forward) };
  const actual: resolveAutoMovieHumanoidSurfaces.IFrame = region(body, side, surface);
  const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
    resolveAutoMovieHumanoidSurfaces.place(actual, bones.get(actual.bone)!);
  return { point: placed.point, normal: placed.normal, forward: turn(local.forward) };
}

/**
 * Exact world-bone demand of a hand-surface frame read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the hand plus actual region-bone demand and caller-owned set.
 * @evidence contracts/development/design.md#principled-representation The frame always needs the hand's forward rotation and a digit additionally needs its actual body-declared region frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the dependency query is exposed beside the existing frame implementation; HumanHand passes its own closed digital classification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same actual region lookup as seating, including custom/fallback region bones.
 */
export namespace readHumanHandFrame {
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

/** Preserve the original body-owned digital surface key and its actual bone. */
function region(body: IHumanBody, side: HumanHand.Side,
  surface: HumanHand.Surface): resolveAutoMovieHumanoidSurfaces.IFrame {
  return body.surfaces.regions[
    `${surface}${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
  ];
}
