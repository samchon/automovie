import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { validateSolidPlanes } from "./validateSolidPlanes";

/**
 * Refuse a blocker that cannot bound anything.
 *
 * The rule is {@link validateSolidPlanes}, raised to a throw: an adapter reading
 * an authored shading solid has no honest result to return for a solid with no
 * faces, so it stops rather than producing one. Sharing the rule is what keeps
 * a neighbour's mass and the building's own canopy held to one standard.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `assertAutoMovieAnalysisSolids` stops an analysis adapter from accepting an unidentifiable, duplicate, or non-bounding blocker.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The assertion applies stable-id checks and the common half-space validator before a solid reaches ray evaluation.
 */
export const assertAutoMovieAnalysisSolids = (
  solids: readonly IAutoMovieAnalysisSolid[],
  label: string,
): void => {
  const seen = new Set<string>();
  for (const solid of solids) {
    if (solid.id.trim().length === 0)
      throw new Error(`every ${label} must carry a non-blank id`);
    if (seen.has(solid.id))
      throw new Error(`${label} id "${solid.id}" is declared twice`);
    seen.add(solid.id);
    const out = new ViolationCollector();
    validateSolidPlanes(solid.planes, `${label}.planes`, label, out);
    const validated = out.toValidation();
    if (validated.success === false) {
      const first = validated.violations[0]!;
      throw new Error(
        `${label} "${solid.id}" is malformed at ${first.path}: ${first.expected}`,
      );
    }
  }
};
