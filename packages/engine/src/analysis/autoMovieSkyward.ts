import { IAutoMovieReferenceGround, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/**
 * Whether a direction points into the sky rather than into the ground.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieSkyward` keeps celestial sampling above the declared reference ground instead of treating downward directions as sky.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The predicate compares a direction with the normalized ground normal to enforce the context's sky hemisphere.
 */
export const autoMovieSkyward = (
  direction: IAutoMovieVector3,
  ground: IAutoMovieReferenceGround,
): boolean => Vector3.dot(direction, Vector3.normalize(ground.up)) > 0;
