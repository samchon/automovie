import type { IAutoMovieTransform } from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeRefusal } from "../core";
import type { createCannon } from "./createCannon";

/**
 * The launch of a shot from a gun at an articulation state: from the muzzle's frame along the bore at the gun's muzzle velocity, carrying a round shot of its calibre (#3484, #3479).
 *
 * @param gun A cannon whose kind publishes a muzzle velocity.
 * @param state The articulations' travels, such as its elevation; at rest when absent.
 * @returns The launch.
 * @throws {ArchetypeRefusal} For a kind that publishes no muzzle velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is launched, from where and when it is refused.
 * @evidence contracts/development/implementation.md#principled-implementation The muzzle socket's `+Y` is the bore's direction at every elevation, since it rides the tube; the speed is the read muzzle velocity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse, articulate, read the frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kind with no read velocity is refused, never given a default speed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One articulation at most.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of one gun.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function cannonLaunch(
  gun: Archetype<createCannon.Affordance, createCannon.Dimension>,
  state: Readonly<Partial<Record<createCannon.Affordance, number>>> = {},
): createCannon.ILaunch {
  const speed: number | undefined = gun.dimensions.muzzleVelocity;
  if (speed === undefined)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "kind",
      value: gun.name,
      feasible: { kind: "alternatives", values: ["fieldGun", "navalGun"] },
      reason: `the ${gun.name} publishes no muzzle velocity`,
      fix: "launch from a field gun or a naval gun",
    });
  const posed: Archetype<createCannon.Affordance, createCannon.Dimension> =
    Object.keys(state).length === 0 ? gun : gun.articulate(state);
  const muzzle: IAutoMovieTransform = posed.affordance("muzzle").frame;
  return {
    origin: muzzle.translation,
    direction: ArchetypeFrame.axis(muzzle, "y"),
    speed,
    calibre:
      gun.dimensions.ball !== undefined
        ? gun.dimensions.ball
        : gun.dimensions.bore!,
  };
}
