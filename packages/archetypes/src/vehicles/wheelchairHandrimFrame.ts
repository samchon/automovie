import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import type { createWheelchair } from "./createWheelchair";
import type { rideWheelchair } from "./rideWheelchair";

/**
 * Adapt the wheelchair ride's contact reader for one scripted handrim
 * stroke. At the catch, select the material point at the authored angle
 * from chair up, positive toward the front. At each sample, carry the
 * same point on the rotating wheel. Other affordances pass through.
 *
 * Pass the returned reader as the contact callback of `HumanObject.prop`,
 * translating film seconds into ride seconds if the course starts later.
 * For a repeated stroke, build a reader for each catch and dispatch during
 * that stroke's time interval.
 *
 * @param ride The wheelchair ride whose placement and rotation are sampled.
 * @param catchAt Seconds on the ride clock when the hand meets the rim.
 * @param degrees Angle at the catch, measured in chair coordinates.
 * @returns A reader yielding a rim point with a radial +Y and tangential +X.
 * @throws {RangeError} When catch time or angle is outside the finite ride domain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two clocks, the sign of the angle, and the material point convention.
 * @evidence contracts/development/implementation.md#principled-implementation The radial vector chosen in chair coordinates at the catch is converted once to wheel material coordinates, then rotated and translated by the posed rim frame at each sample.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Cache the two possible rim selections, then specialize those two ids in the reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Radius and rotation come from the ride's posed model. An absent rim stays absent and follows the ride's normal refusal path.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for a two-wheel selection and constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses ride.frame for articulation, Quaternion and Vector3 for rotation, and AutoMovieArchetypeFrame.facing for orientation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The reader retains two local vectors and its source ride only.
 */
export function wheelchairHandrimFrame(
  ride: ReturnType<typeof rideWheelchair>,
  catchAt: number,
  degrees: number,
): (id: createWheelchair.Affordance, seconds: number) => IAutoMovieTransform {
  if (
    !Number.isFinite(catchAt) ||
    catchAt < 0 ||
    catchAt > ride.duration ||
    !Number.isFinite(degrees) ||
    Math.abs(degrees) > 180
  )
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
  const selections: Map<createWheelchair.Affordance, IAutoMovieVector3> =
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
    id: createWheelchair.Affordance,
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
