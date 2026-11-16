import type { IAutoMovieTransform } from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeRefusal } from "../core";
import type { createCannon } from "./createCannon";

/**
 * The launch of a shot from a gun at an articulation state: from the muzzle's frame along the bore at the gun's muzzle velocity, carrying a round shot of its calibre (#3484, #3479).
 *
 * @param gun A cannon whose kind publishes a muzzle velocity.
 * @param state A nonempty absolute articulation state, such as elevation; absent or empty uses the gun's current pose, including prior recoil or elevation.
 * @returns The launch with its own origin vector; changing it does not move the gun's muzzle contact.
 * @throws {ArchetypeRefusal} For unknown velocity or shot diameter, invalid numeric launch data, or a shot that does not fit a declared bore.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is launched, from where and when it is refused.
 * @evidence contracts/development/implementation.md#principled-implementation The muzzle socket's +Y is the bore direction at every elevation because it rides the tube. Speed is the recorded muzzle velocity and calibre the separately recorded shot diameter; positive windage is checked when the bore is declared.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse, articulate, read the frame.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown velocity or shot diameter is refused, without a speed default or treating a bore as a shot. Finite positive data and clearance inside a declared bore are admitted. The launch owns its mutable origin rather than exposing the model's contact vector.
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
  if (!(Number.isFinite(speed) && speed > 0))
    throw new ArchetypeRefusal({
      kind: "parameter", archetype: "cannon", axis: "muzzleVelocity", value: speed,
      feasible: null, reason: "launch velocity must be finite and positive",
      fix: "supply a recorded finite positive muzzle velocity in metres per second",
    });
  const calibre: number | undefined = gun.dimensions.ball;
  const bore: number | undefined = gun.dimensions.bore;
  if (!(calibre !== undefined && Number.isFinite(calibre) && calibre > 0))
    throw new ArchetypeRefusal({
      kind: "parameter", archetype: "cannon", axis: "ball", value: calibre,
      feasible: null, reason: "launch needs a known finite positive shot diameter, not a bore diameter",
      fix: "supply the recorded shot diameter in metres",
    });
  if (bore !== undefined && !(Number.isFinite(bore) && bore > calibre))
    throw new ArchetypeRefusal({
      kind: "parameter", archetype: "cannon", axis: "bore", value: bore,
      feasible: null, reason: "the declared bore must be finite and wider than the shot",
      fix: "use a shot and bore with their recorded positive windage",
    });
  const posed: Archetype<createCannon.Affordance, createCannon.Dimension> =
    Object.keys(state).length === 0 ? gun : gun.articulate(state);
  const muzzle: IAutoMovieTransform = posed.affordance("muzzle").frame;
  return {
    origin: { ...muzzle.translation },
    direction: ArchetypeFrame.axis(muzzle, "y"),
    speed,
    calibre,
  };
}
