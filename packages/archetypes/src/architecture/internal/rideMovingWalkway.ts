import type {
  AutoMovieHumanSide,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core";
import type { AutoMovieArchetypeMovingWalkway } from "../AutoMovieArchetypeMovingWalkway";
/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
/** The identity rotation of the level band. */
const LEVEL: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };
/**
 * The greatest pallet band speed EN 115-1 permits, m/s (KONE 5.4,
 * https://www.kone.co.uk/Images/Escalator%20planning%20guide%20GBIR_tcm45-86614.pdf).
 */
const MAXIMUM: number = 0.75;
/**
 * A moving walkway's band running at a constant speed, read on the ride's
 * clock: at second 0 the band model (`AutoMovieArchetypeMovingWalkway.belt`) lies on the
 * walkway. The band translates along the walkway's `+Z` running `forward`, or
 * `-Z` running `backward`, and each handrail moves with it.
 *
 * @param walkway The installed walkway.
 * @param placement Its world placement.
 * @param ride The band speed and running direction.
 * @returns The band and handrail frames on the ride's clock.
 * @throws {AutoMovieArchetypeRefusal} For a speed that is not positive or
 *   exceeds EN 115-1's 0.75 m/s.
 */
export function rideMovingWalkway(
  walkway: AutoMovieArchetype<
    AutoMovieArchetypeMovingWalkway.Affordance,
    AutoMovieArchetypeMovingWalkway.Dimension
  >,
  placement: IAutoMovieTransform,
  ride: AutoMovieArchetypeMovingWalkway.IRideParams,
  railOffset: number,
): AutoMovieArchetypeMovingWalkway.IRideResult {
  if (!(ride.speed > 0 && ride.speed <= MAXIMUM))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "movingWalkway",
      axis: "speed",
      value: ride.speed,
      feasible: { kind: "range", minimum: 0, maximum: MAXIMUM, unit: "m/s" },
      reason: "EN 115-1 permits a pallet band speed up to 0.75 m/s",
      fix: "run the band at a positive speed of at most 0.75 m/s",
    });
  const velocity: number =
    (ride.direction === "backward" ? -1 : 1) * ride.speed;
  const rail: number =
    walkway.dimensions.width! / 2 + railOffset;
  return {
    velocity,
    belt: (seconds: number): IAutoMovieTransform =>
      AutoMovieArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: 0, z: velocity * seconds },
        rotation: LEVEL,
      }),
    handrail: (
      side: AutoMovieHumanSide,
      at: number,
      seconds: number,
    ): IAutoMovieTransform =>
      AutoMovieArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: {
          x: (side === "left" ? 1 : -1) * rail,
          y: walkway.dimensions.handrail!,
          z: at + velocity * seconds,
        },
        rotation: LEVEL,
      }),
  };
}
