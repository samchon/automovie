import { IAutoMovieHalfSpacePlane } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES } from "./AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES";

/**
 * Check the half-spaces of one convex blocker.
 *
 * Shared by the context validator and by every adapter that accepts an authored
 * shading solid, so a neighbour's mass and the building's own canopy are held
 * to exactly the same standard.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `validateSolidPlanes` identifies a blocker with too few faces, a zero normal, a non-finite plane, or duplicate geometry.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The shared plane check emits ordered diagnostics for every malformed half-space in one authored context solid.
 */
export const validateSolidPlanes = (
  planes: readonly IAutoMovieHalfSpacePlane[],
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (planes.length < AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES)
    out.push(
      "range",
      path,
      `a convex ${label} needs at least ${AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES} half-spaces to bound a solid, but had ${planes.length}`,
      planes.length,
    );
  planes.forEach((plane, index) => {
    direction(
      plane.normal,
      `${path}[${index}].normal`,
      `${label} plane normal`,
      out,
    );
    if (!Number.isFinite(plane.offset))
      out.push(
        "range",
        `${path}[${index}].offset`,
        `${label} plane offset must be finite, but was ${plane.offset}`,
        plane.offset,
      );
  });
};
