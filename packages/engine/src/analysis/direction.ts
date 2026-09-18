/**
 * Shared by validateAutoMovieEnvironmentContext, validateSolidPlanes, autoMovieSolidBlocks, autoMovieRayObstructed, autoMovieSkyward, autoMovieContextSolids, which were one file until each public identity took its own.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES` sets the minimum authored half-space count accepted for an environmental occluder.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The four-plane threshold rejects obstruction inputs that cannot enclose a three-dimensional context mass.
 * @author Samchon
 */
export const direction = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      out.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
  const length = Vector3.length(value);
  if (Number.isFinite(length) && length <= AXIS_EPSILON)
    out.push("range", path, `${label} must be a non-zero direction`, value);
};
