import { IAutoMovieHalfSpacePlane } from "@automovie/interface";

/**
 * One convex blocker an analysis ray may be stopped by.
 *
 * Both a read-only neighbouring mass and a building's own shading solid are
 * this shape, which is what lets one occlusion routine serve both without
 * either becoming the other. What a solid is _not_ is ownership: the caller
 * decides which list a solid came from, and the analysis never returns a
 * context mass as building geometry.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `IAutoMovieAnalysisSolid` represents one declared convex context mass that may block an analysis ray without becoming building geometry.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The solid contributes a stable key and an intersection of half-spaces to the shared environmental obstruction state.
 */
export interface IAutoMovieAnalysisSolid {
  /**
   * Stable identity of the blocker within its own list.
   *
   * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state Solid `id` keeps each environmental blocker traceable within its declared ownership list.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The stable key supports duplicate detection and prevents a context mass from aliasing a building-owned subject.
   */
  id: string;
  /**
   * Half-spaces whose intersection is the solid; at least four.
   *
   * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `planes` explicitly bound the neighbouring mass used for sun, sky, and source obstruction tests.
   * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The half-space list supplies the analytic entry and exit constraints for every ray crossing this context solid.
   */
  planes: readonly IAutoMovieHalfSpacePlane[];
}
