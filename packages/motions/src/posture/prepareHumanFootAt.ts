import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/**
 * Prepare a foot's fixed articulation while its sole contact moves in space.
 *
 * @param body The fixed body and sole socket owner.
 * @param side The foot.
 * @param pivot The socket whose position varies.
 * @param heading The fixed heading, degrees about +Y.
 * @param pitch The fixed pitch, degrees, positive toes up.
 * @param toes The fixed toe flexion, degrees; zero when absent.
 * @param roll The fixed foot roll, degrees; zero when absent.
 * @returns A reader of the contact in world metres with `HumanFoot.pivot`'s placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/socket/articulation, angular defaults and the moving world contact.
 * @evidence contracts/development/implementation.md#principled-implementation Calls the existing rotation and articulated offset owners once, rotates that fixed socket once, then uses the original ankle translation for every contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed rotation and rotated offset precede one contact reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves quaternion multiplication/normalization and Vector3.subtract grouping; no contact or angle is approximated, and outputs expose no retained mutable rotation or offset.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation; repeated contact trials omit fixed quaternion construction, articulation lookup and socket rotation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, socket, heading, pitch, toe flexion and roll determine one fixed rotated offset; changing any requires a new reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains one private rotation and offset until its owning contact solve releases it, without a contact history or external handle.
 */
export function prepareHumanFootAt(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
  heading: number,
  pitch: number,
  toes: number = 0,
  roll: number = 0,
): (at: IAutoMovieVector3) => IAutoMovieMotionHumanFoot.IPlacement {
  const rotation: IAutoMovieQuaternion = HumanFoot.rotation(heading, pitch, roll);
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    rotation, HumanFoot.offset(body, side, pivot, toes),
  );
  return (at: IAutoMovieVector3): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: Vector3.subtract(at, offset),
    rotation: { ...rotation },
  });
}
