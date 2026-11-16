import { type Archetype, ArchetypeRefusal, type ArchetypeTrack } from "../core";
import { FIELD_GUN } from "./FIELD_GUN";
import type { createCannon } from "./createCannon";

/**
 * A field gun's recoil after a shot: its `recoil` slider run back from rest by the gun's `recoil` and slowed evenly to rest, starting at the shot.
 *
 * The run starts at the speed the shot's momentum gives the gun, the shot's read mass times its muzzle velocity over the gun's mass, the powder's gases neglected; on Douglas's 32-pounder the same balance gives the 7 ft/s he observed (A Treatise on Naval Gunnery, p. 110). Slowed evenly over the run, it lasts twice the run over that speed.
 *
 * @param gun A field gun.
 * @param start The finite film second of the shot, at which the recoil's finite end must still be representably later.
 * @returns The recoil's track.
 * @throws {ArchetypeRefusal} For a gun without a recoil slider, non-finite start or sample time, or an unrepresentable recoil interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the start speed, the even slowing and the duration.
 * @evidence contracts/development/implementation.md#principled-implementation Conservation of momentum gives start speed v0 and duration T=2d/v0. Uniform deceleration gives x=d u(2-u), u=t/T, the same quadratic as v0 t-v0²t²/(4d) with exact held endpoints. Finite representable film seconds are admitted before computing an offset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse, the start speed, the duration, the closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The even slowing is the simplest law that stops the run at its read length; unmeasured gas momentum remains neglected. Invalid film time is refused, never clamped or replaced. Before/after the finite interval the documented held travel is returned exactly, without a numerical bound margin.
 * @evidence contracts/development/implementation.md#efficient-algorithms A closed form per second.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one gun.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The track closes over four scalar values: run, duration, start and end; it retains no gun, sample history, handle or asynchronous work.
 */
export function cannonRecoil(
  gun: Archetype<createCannon.Affordance, createCannon.Dimension>,
  start: number,
): ArchetypeTrack.ITrack<createCannon.Affordance> {
  if (!gun.affordances.some((a: { id: string }): boolean => a.id === "recoil"))
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
  const end: number = start + duration;
  if (!(Number.isFinite(start) && Number.isFinite(end) && end > start))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "start",
      value: start,
      feasible: null,
      reason:
        "recoil needs finite film seconds with a representably later finite end",
      fix: "choose a finite shot second at which the recoil duration is representable",
    });
  return {
    articulation: "recoil",
    start,
    end,
    travel: (seconds: number): number => {
      if (!Number.isFinite(seconds))
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: "cannon",
          axis: "seconds",
          value: seconds,
          feasible: null,
          reason: "a recoil sample needs a finite film second",
          fix: "sample the track at a finite film second",
        });
      if (seconds <= start) return 0;
      if (seconds >= end) return run;
      const u: number = (seconds - start) / duration;
      return run * (u * (2 - u));
    },
    launch: null,
  };
}
