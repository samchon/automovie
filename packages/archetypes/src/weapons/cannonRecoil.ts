import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeTrack,
} from "../core";
import { ArchetypeTrackTime } from "../core/ArchetypeTrackTime";
import { FIELD_GUN } from "./FIELD_GUN";
import type { createCannon } from "./createCannon";

/**
 * A field gun's recoil after a shot: its `recoil` slider run back from rest by
 * the gun's `recoil` and slowed evenly to rest, starting at the shot.
 *
 * The run starts at the speed the shot's momentum gives the gun, the shot's
 * read mass times its muzzle velocity over the gun's mass, the powder's gases
 * neglected; on Douglas's 32-pounder the same balance gives the 7 ft/s he
 * observed (A Treatise on Naval Gunnery, p. 110). Slowed evenly over the run,
 * it lasts twice the run over that speed.
 *
 * @param gun A field gun.
 * @param start The finite film second of the shot, at which the recoil's finite
 *   end must still be representably later.
 * @returns The recoil's track.
 * @throws {AutoMovieArchetypeRefusal} For a gun without a recoil slider,
 *   non-finite start or sample time, or an unrepresentable recoil interval.
 */
export function cannonRecoil(
  gun: AutoMovieArchetype<createCannon.Affordance, createCannon.Dimension>,
  start: number,
): AutoMovieArchetypeTrack.ITrack<createCannon.Affordance> {
  if (!gun.affordances.some((a: { id: string }): boolean => a.id === "recoil"))
    throw new AutoMovieArchetypeRefusal({
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
  const end: number = ArchetypeTrackTime.end("cannon", start, duration);
  return {
    articulation: "recoil",
    start,
    end,
    travel: (seconds: number): number => {
      const elapsed: number = ArchetypeTrackTime.elapsed(
        "cannon",
        seconds,
        start,
        end,
        duration,
      );
      if (elapsed === 0) return 0;
      if (elapsed === duration) return run;
      const u: number = elapsed / duration;
      return run * (u * (2 - u));
    },
    launch: null,
  };
}
