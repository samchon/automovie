/**
 * Shared by validateAutoMovieEnvironmentContext, autoMovieContextSolids, which were one file until each public identity took its own.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES` sets the minimum authored half-space count accepted for an environmental occluder.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The four-plane threshold rejects obstruction inputs that cannot enclose a three-dimensional context mass.
 * @author Samchon
 */
export const positiveOrZero = (
  value: number,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < 0)
    out.push(
      "range",
      path,
      `${label} must be a finite number at or above zero, but was ${value}`,
      value,
    );
};
