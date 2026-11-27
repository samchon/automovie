import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeWheelchair } from "../AutoMovieArchetypeWheelchair";

/*
 * Adapt the wheelchair ride's contact reader for one scripted handrim stroke.
 * At the catch, select the material point at the authored angle from chair up,
 * positive toward the front. At each sample, carry the same point on the
 * rotating wheel. Other affordances pass through.
 *
 * Pass the returned reader as the contact callback of `HumanObject.prop`,
 * translating film seconds into ride seconds if the course starts later. For a
 * repeated stroke, build a reader for each catch and dispatch during that
 * stroke's time interval.
 * Parameter ride: The wheelchair ride whose placement and rotation are sampled.
 * Parameter catchAt: Seconds on the ride clock when the hand meets the rim.
 * Parameter degrees: Angle at the catch, measured in chair coordinates.
 * Returns: A reader yielding a rim point with a radial +Y and tangential +X.
 * When catch time or angle is outside the finite ride
 * domain.
 */
export function wheelchairHandrimFrame(
  ride: ReturnType<typeof AutoMovieArchetypeWheelchair.ride>,
  catchAt: number,
  degrees: number,
): (id: AutoMovieArchetypeWheelchair.Affordance, seconds: number) => IAutoMovieTransform {
  if (catchAt < 0 || catchAt > ride.duration || Math.abs(degrees) > 180)
    throw new RangeError(
      "handrim catch needs a ride second and an angle in [-180, 180] degrees",
    );

  const at: ReturnType<typeof ride.at> = ride.at(catchAt);
  const angle: number = (degrees * Math.PI) / 180;
  const radial: IAutoMovieVector3 = Quaternion.rotateVector(
    at.placement.rotation,
    {
      x: 0,
      y: Math.cos(angle),
      z: Math.sin(angle),
    },
  );
  const selections: Map<AutoMovieArchetypeWheelchair.Affordance, IAutoMovieVector3> =
    new Map();
  for (const rim of ["leftRim", "rightRim"] as const) {
    const radius: number | undefined = at.archetype.affordances.find(
      (part: IAutoMovieAffordance): boolean =>
        part.id === rim && part.kind === "wheel",
    )?.radius;
    if (radius === undefined) continue;
    selections.set(
      rim,
      Quaternion.rotateVector(
        Quaternion.inverse(ride.frame(rim, catchAt).rotation),
        Vector3.scale(radial, radius),
      ),
    );
  }
  return (
    id: AutoMovieArchetypeWheelchair.Affordance,
    seconds: number,
  ): IAutoMovieTransform => {
    const frame: IAutoMovieTransform = ride.frame(id, seconds);
    const selected: IAutoMovieVector3 | undefined = selections.get(id);
    if (selected === undefined) return frame;
    const spoke: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      selected,
    );
    const axle: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    return AutoMovieArchetypeFrame.facing(
      Vector3.add(frame.translation, spoke),
      spoke,
      Vector3.cross(axle, spoke),
    );
  };
}
