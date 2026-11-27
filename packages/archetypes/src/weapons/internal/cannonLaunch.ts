import type { IAutoMovieTransform } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core/index";
import type { AutoMovieArchetypeCannon } from "../AutoMovieArchetypeCannon";

/**
 * The launch of a shot from a gun at an articulation state: from the muzzle's
 * frame along the bore at the gun's muzzle velocity, carrying a round shot of
 * its calibre (#3484, #3479).
 *
 * @param gun A cannon whose kind publishes a muzzle velocity.
 * @param state A nonempty absolute articulation state, such as elevation;
 *   absent or empty uses the gun's current pose, including prior recoil or
 *   elevation.
 * @returns The launch with its own origin vector; changing it does not move the
 *   gun's muzzle contact.
 * @throws {AutoMovieArchetypeRefusal} For unknown velocity or shot diameter,
 *   invalid numeric launch data, or a shot that does not fit a declared bore.
 */
export function cannonLaunch(
  gun: AutoMovieArchetype<AutoMovieArchetypeCannon.Affordance, AutoMovieArchetypeCannon.Dimension>,
  state: Readonly<Partial<Record<AutoMovieArchetypeCannon.Affordance, number>>> = {},
): AutoMovieArchetypeCannon.ILaunch {
  const speed: number | undefined = gun.dimensions.muzzleVelocity;
  if (speed === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "kind",
      value: gun.name,
      feasible: { kind: "alternatives", values: ["fieldGun", "navalGun"] },
      reason: `the ${gun.name} publishes no muzzle velocity`,
      fix: "launch from a field gun or a naval gun",
    });
  if (!(speed > 0 && speed < Infinity))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "muzzleVelocity",
      value: speed,
      feasible: null,
      reason: "launch velocity must be finite and positive",
      fix: "supply a recorded finite positive muzzle velocity in metres per second",
    });
  const calibre: number | undefined = gun.dimensions.ball;
  const bore: number | undefined = gun.dimensions.bore;
  if (!(calibre !== undefined && calibre > 0 && calibre < Infinity))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "ball",
      value: calibre,
      feasible: null,
      reason:
        "launch needs a known finite positive shot diameter, not a bore diameter",
      fix: "supply the recorded shot diameter in metres",
    });
  if (bore !== undefined && !(bore > calibre && bore < Infinity))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "cannon",
      axis: "bore",
      value: bore,
      feasible: null,
      reason: "the declared bore must be finite and wider than the shot",
      fix: "use a shot and bore with their recorded positive windage",
    });
  const posed: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = Object.keys(state).length === 0 ? gun : gun.articulate(state);
  const muzzle: IAutoMovieTransform = posed.affordance("muzzle").frame;
  return {
    origin: { ...muzzle.translation },
    direction: AutoMovieArchetypeFrame.axis(muzzle, "y"),
    speed,
    calibre,
  };
}
