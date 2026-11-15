import { type Archetype, ArchetypeRefusal, type ArchetypeTrack } from "../core";
import { FIELD_GUN } from "./FIELD_GUN";
import type { createCannon } from "./createCannon";

/**
 * A field gun's recoil after a shot: its `recoil` slider run back from rest by the gun's `recoil` and slowed evenly to rest, starting at the shot.
 *
 * The run starts at the speed the shot's momentum gives the gun, the shot's read mass times its muzzle velocity over the gun's mass, the powder's gases neglected; on Douglas's 32-pounder the same balance gives the 7 ft/s he observed (A Treatise on Naval Gunnery, p. 110). Slowed evenly over the run, it lasts twice the run over that speed.
 *
 * @param gun A field gun.
 * @param start The film second of the shot.
 * @returns The recoil's track.
 * @throws {ArchetypeRefusal} For a gun without a `recoil` slider.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the start speed, the even slowing and the duration.
 * @evidence contracts/development/implementation.md#principled-implementation Conservation of momentum for the start speed and uniform deceleration over the read run: `x = v0 t - v0^2 t^2 / (4 d)`, at rest when `t = 2 d / v0`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse, the start speed, the duration, the closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The even slowing is the simplest law that stops the run at its read length; the gases' share of the momentum is not read and is neglected, as stated.
 * @evidence contracts/development/implementation.md#efficient-algorithms A closed form per second.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one gun.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The track keeps three numbers.
 */
export function cannonRecoil(
  gun: Archetype<createCannon.Affordance, createCannon.Dimension>,
  start: number,
): ArchetypeTrack.ITrack<createCannon.Affordance> {
  if (
    !gun.affordances.some((a: { id: string }): boolean => a.id === "recoil")
  )
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "kind",
      value: gun.name,
      feasible: { kind: "alternatives", values: ["fieldGun"] },
      reason: `the ${gun.name} has no recoil slider`,
      fix: "drive the recoil of a field gun",
    });
  const run: number = gun.dimensions.recoil!;
  const speed: number =
    (FIELD_GUN.SERVICE.shotMass * gun.dimensions.muzzleVelocity!) /
    gun.dimensions.mass!;
  const duration: number = (2 * run) / speed;
  return {
    articulation: "recoil",
    start,
    end: start + duration,
    travel: (seconds: number): number => {
      const t: number = Math.min(Math.max(seconds - start, 0), duration);
      return speed * t - (speed * speed * t * t) / (4 * run);
    },
    launch: null,
  };
}
