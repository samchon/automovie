import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { autoMovieSolidBlocks } from "./autoMovieSolidBlocks";

/**
 * Whether any of the given solids stops the ray.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieRayObstructed` reports whether any authored environmental solid blocks the queried direction before its limit.
 * @evidence requirements/map/movement-and-visibility.md#map-sightline-occlusion `autoMovieRayObstructed` tests the declared origin, direction, maximum distance, and every authored solid to return the sightline's actual blocked state.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The collection operation applies the common convex-solid test in declaration order and returns on the first obstruction.
 * @evidence specifications/world-and-site/traversal-and-visibility.md#world-site-sightline-occlusion The bounded convex-solid ray test implements deterministic world-space sightline occlusion without inventing visibility beyond the supplied solids.
 */
export const autoMovieRayObstructed = (props: {
  origin: IAutoMovieVector3;
  direction: IAutoMovieVector3;
  solids: readonly IAutoMovieAnalysisSolid[];
  maxDistance: number;
}): boolean =>
  props.solids.some((solid) =>
    autoMovieSolidBlocks({
      origin: props.origin,
      direction: props.direction,
      planes: solid.planes,
      maxDistance: props.maxDistance,
    }),
  );
