import { IAutoMovieEnvironmentContext, IAutoMovieValidation } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateSolidPlanes } from "./validateSolidPlanes";

/**
 * Validate the read-only world a building is analysed against.
 *
 * Two rules carry the weight. The first is physical: an instant whose sun is at
 * or below the reference horizon may not declare a direct beam, because a
 * source under the ground plane illuminates nothing and a beam declared there
 * is how a "daylight" study quietly becomes fiction. The second is about
 * ownership: every context id is checked against the ids the building already
 * owns, so a neighbour's mass can never be addressed as, or mistaken for, a
 * part of the work.
 *
 * Instant ordering is validated rather than repaired. Sorting silently would
 * make two differently-authored contexts produce the same artifact and hide an
 * authoring mistake that a reader needs to see.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `validateAutoMovieEnvironmentContext` refuses physically contradictory sunlight, unstable instant order, malformed blockers, and context-to-building identity collisions.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The validator checks the shared instant, celestial, irradiance, ordering, ownership, and obstruction invariants before any consumer samples them.
 * @author Samchon
 */
export const validateAutoMovieEnvironmentContext = (props: {
  /** Context to check. */
  context: IAutoMovieEnvironmentContext;
  /**
   * Ids the building already owns: elements, spaces, boundaries. A context id
   * colliding with one of these is refused.
   */
  reserved?: readonly string[];
}): IAutoMovieValidation => {
  const { context } = props;
  const out = new ViolationCollector();
  const root = "$input";
  const reserved = new Set(props.reserved ?? []);

  nonEmpty(context.id, `${root}.id`, "environment context id", out);
  if (context.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `environment context schema version must be 1, but was ${context.version}`,
      context.version,
    );
  if (context.units !== "meter")
    out.push(
      "type",
      `${root}.units`,
      `environment context units must be "meter", but were ${String(context.units)}`,
      context.units,
    );
  direction(context.north, `${root}.north`, "site north", out);
  direction(context.ground.up, `${root}.ground.up`, "reference ground up", out);
  if (!Number.isFinite(context.ground.elevation))
    out.push(
      "range",
      `${root}.ground.elevation`,
      `reference ground elevation must be finite, but was ${context.ground.elevation}`,
      context.ground.elevation,
    );

  const owned = (id: string, path: string, label: string): void => {
    if (reserved.has(id))
      out.push(
        "type",
        path,
        `${label} "${id}" is already owned by the building; external context must never reuse a building-owned id`,
        id,
      );
  };
  owned(context.id, `${root}.id`, "environment context id");

  const instantIds = new Set<string>();
  let previous: number | null = null;
  context.instants.forEach((instant, index) => {
    const path = `${root}.instants[${index}]`;
    nonEmpty(instant.id, `${path}.id`, "instant id", out);
    nonEmpty(instant.label, `${path}.label`, "instant label", out);
    if (instantIds.has(instant.id))
      out.push(
        "type",
        `${path}.id`,
        `instant id "${instant.id}" must be unique`,
        instant.id,
      );
    instantIds.add(instant.id);
    owned(instant.id, `${path}.id`, "instant id");
    if (!Number.isFinite(instant.time))
      out.push(
        "range",
        `${path}.time`,
        `instant time must be finite, but was ${instant.time}`,
        instant.time,
      );
    else {
      if (previous !== null && instant.time <= previous)
        out.push(
          "range",
          `${path}.time`,
          `instants must be strictly increasing in time, but ${instant.time} follows ${previous}`,
          instant.time,
        );
      previous = instant.time;
    }
    direction(instant.sun, `${path}.sun`, "sun direction", out);
    positiveOrZero(
      instant.directNormalIlluminance,
      `${path}.directNormalIlluminance`,
      "direct normal illuminance",
      out,
    );
    positiveOrZero(
      instant.diffuseHorizontalIlluminance,
      `${path}.diffuseHorizontalIlluminance`,
      "diffuse horizontal illuminance",
      out,
    );
    if (
      instant.outdoorAirTemperature !== null &&
      !Number.isFinite(instant.outdoorAirTemperature)
    )
      out.push(
        "range",
        `${path}.outdoorAirTemperature`,
        `outdoor air temperature must be null or finite, but was ${instant.outdoorAirTemperature}`,
        instant.outdoorAirTemperature,
      );
    if (instant.outdoorRelativeHumidity !== null)
      out.range(
        `${path}.outdoorRelativeHumidity`,
        instant.outdoorRelativeHumidity,
        0,
        1,
        "outdoor relative humidity",
      );
    // A sun under the horizon delivers no beam. Checked only once both
    // directions are usable, so a zero vector reports its own fault instead of
    // producing a second, derived complaint about the same field.
    if (
      Vector3.length(instant.sun) > AXIS_EPSILON &&
      Vector3.length(context.ground.up) > AXIS_EPSILON &&
      Number.isFinite(instant.directNormalIlluminance) &&
      instant.directNormalIlluminance > 0 &&
      Vector3.dot(
        Vector3.normalize(instant.sun),
        Vector3.normalize(context.ground.up),
      ) <= 0
    )
      out.push(
        "range",
        `${path}.directNormalIlluminance`,
        `instant "${instant.id}" places the sun at or below the reference horizon, so its direct normal illuminance must be 0, but was ${instant.directNormalIlluminance}`,
        instant.directNormalIlluminance,
      );
  });

  const occluderIds = new Set<string>();
  context.occluders.forEach((occluder, index) => {
    const path = `${root}.occluders[${index}]`;
    nonEmpty(occluder.id, `${path}.id`, "occluder id", out);
    nonEmpty(occluder.kind, `${path}.kind`, "occluder kind", out);
    if (occluderIds.has(occluder.id))
      out.push(
        "type",
        `${path}.id`,
        `occluder id "${occluder.id}" must be unique`,
        occluder.id,
      );
    occluderIds.add(occluder.id);
    owned(occluder.id, `${path}.id`, "occluder id");
    validateSolidPlanes(occluder.planes, `${path}.planes`, "occluder", out);
  });

  return out.toValidation();
};
