/**
 * The fewest half-spaces whose intersection can bound a solid in 3D.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES` sets the minimum authored half-space count accepted for an environmental occluder.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The four-plane threshold rejects obstruction inputs that cannot enclose a three-dimensional context mass.
 */
export const AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES = 4;
