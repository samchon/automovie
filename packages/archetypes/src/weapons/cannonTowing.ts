import type { Archetype } from "../core";
import type { ArchetypeTowing } from "../core/ArchetypeTowing";
import { towingAxle } from "../core/towingAxle";
import type { createCannon } from "./createCannon";

/**
 * Declare the actual field gun's transverse wheel support for limbered towing.
 *
 * @param gun Actual fieldGun output; its trail coupling is behind its own +Z.
 * @returns Its actual axle, permitting rigid pitch while its two wheels stay grounded.
 * @throws {RangeError} For another producer/kind or invalid actual wheel-axis geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names field-gun wheel support, reverse towing at the real trail contact and independent model-space metre output.
 * @evidence contracts/development/implementation.md#principled-implementation The actual left/right wheel-spin frames define the axle; generic single-axle geometry derives reverse orientation from the source coupling's side of that axle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the producer-owned kind and delegate the shared actual axle reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A naval four-wheel carriage or mortar is never presented as a free single axle, and no hardcoded pintle offset changes the field gun.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two actual contact reads and constant axle admission.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses towingAxle and the generic support solver instead of copying either geometry law.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent scalar coordinates and retains no gun/frame reference.
 */
export function cannonTowing(
  gun: Archetype<createCannon.Affordance, createCannon.Dimension>,
): ArchetypeTowing.Support<createCannon.Affordance> {
  if (gun.archetype !== "cannon" || gun.name !== "fieldGun")
    throw new RangeError(
      "Only the actual two-wheel field gun declares this towing support",
    );
  return {
    kind: "singleAxle",
    axle: towingAxle(gun.affordance("leftSpin"), gun.affordance("rightSpin")),
  };
}
