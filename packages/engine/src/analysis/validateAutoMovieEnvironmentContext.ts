import {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  type IAutoMovieValidateEnvironmentContext,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { directionLength } from "../validation/directionLength";
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
 * Under the typed context-container premise, violations are returned with paths
 * rooted at `$input`; resident instant and occluder slots are visited by index
 * and absent records are refused at their slots. Other nested container shapes
 * remain a caller premise.
 *
 * Directions (north, ground up, each sun) must be finite and longer than
 * `1e-12` but need not be unit length; units must be `"meter"`, instant times
 * strictly increasing, illuminances finite and at or above zero, and an outdoor
 * relative humidity null or within `[0, 1]`. Occluder planes follow
 * `validateSolidPlanes`. The horizon rule is skipped while the sun or the
 * ground up has an unusable measured length. A nonfinite measured norm is a
 * range violation; horizon arithmetic is skipped for that invalid direction.
 */
export function validateAutoMovieEnvironmentContext(
  props: IAutoMovieValidateEnvironmentContext.IProps,
): IAutoMovieValidation {
  const context: IAutoMovieEnvironmentContext = props.context;
  const out: IAutoMovieViolationCollector = new ViolationCollector();
  const root: string = "$input";
  const reserved: Set<string> = new Set<string>(props.reserved ?? []);

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
  out.direction(`${root}.north`, context.north, "site north");
  out.direction(`${root}.ground.up`, context.ground.up, "reference ground up");
  const up: IAutoMovieVector3 | null =
    directionLength(context.ground.up) === null
      ? null
      : Vector3.normalize(context.ground.up);

  const owned: (id: string, path: string, label: string) => void = (
    id: string,
    path: string,
    label: string,
  ): void => {
    if (reserved.has(id))
      out.push(
        "type",
        path,
        `${label} "${id}" is already owned by the building; external context must never reuse a building-owned id`,
        id,
      );
  };
  owned(context.id, `${root}.id`, "environment context id");

  const instantIds: Set<string> = new Set<string>();
  let previous: number | null = null;
  for (let index: number = 0; index < context.instants.length; ++index) {
    const instant: IAutoMovieEnvironmentInstant | undefined =
      context.instants[index];
    const path: string = `${root}.instants[${index}]`;
    if (instant === undefined) {
      out.push(
        "type",
        path,
        "a resident instant slot must contain its declared record",
        instant,
      );
      continue;
    }
    out.nonEmpty(`${path}.label`, instant.label, "instant label");
    if (instantIds.has(instant.id))
      out.push(
        "type",
        `${path}.id`,
        `instant id "${instant.id}" must be unique`,
        instant.id,
      );
    instantIds.add(instant.id);
    owned(instant.id, `${path}.id`, "instant id");
    if (previous !== null && instant.time <= previous)
      out.push(
        "range",
        `${path}.time`,
        `instants must be strictly increasing in time, but ${instant.time} follows ${previous}`,
        instant.time,
      );
    previous = instant.time;
    out.direction(`${path}.sun`, instant.sun, "sun direction");
    for (const [key, label] of [
      ["directNormalIlluminance", "direct normal illuminance"],
      ["diffuseHorizontalIlluminance", "diffuse horizontal illuminance"],
    ] as const)
      if (instant[key] < 0)
        out.push(
          "range",
          `${path}.${key}`,
          `${label} must be a finite number at or above zero, but was ${instant[key]}`,
          instant[key],
        );
    if (instant.outdoorRelativeHumidity !== null)
      out.range(
        `${path}.outdoorRelativeHumidity`,
        instant.outdoorRelativeHumidity,
        0,
        1,
        "outdoor relative humidity",
      );
    if (
      up !== null &&
      instant.directNormalIlluminance > 0 &&
      directionLength(instant.sun) !== null &&
      Vector3.dot(Vector3.normalize(instant.sun), up) <= 0
    )
      out.push(
        "range",
        `${path}.directNormalIlluminance`,
        `instant "${instant.id}" places the sun at or below the reference horizon, so its direct normal illuminance must be 0, but was ${instant.directNormalIlluminance}`,
        instant.directNormalIlluminance,
      );
  }

  const occluderIds: Set<string> = new Set<string>();
  for (let index: number = 0; index < context.occluders.length; ++index) {
    const occluder: IAutoMovieContextOccluder | undefined =
      context.occluders[index];
    const path: string = `${root}.occluders[${index}]`;
    if (occluder === undefined) {
      out.push(
        "type",
        path,
        "a resident occluder slot must contain its declared record",
        occluder,
      );
      continue;
    }
    out.nonEmpty(`${path}.kind`, occluder.kind, "occluder kind");
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
  }

  return out.toValidation();
}
