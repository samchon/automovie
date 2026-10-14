import {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateSolidPlanes } from "./validateSolidPlanes";

/** Directions this short or shorter carry no direction at all. */
const AXIS_EPSILON: number = 1e-12;

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
 * Under the typed context-container premise, violations are returned with paths rooted at `$input`; resident instant and occluder slots are visited by index and absent records are refused at their slots. Other nested container shapes remain a caller premise.
 *
 * Directions (north, ground up, each sun) must be finite and longer
 * than `1e-12` but need not be unit length; units must be `"meter"`, instant
 * times strictly increasing, illuminances finite and at or above zero, and an
 * outdoor relative humidity null or within `[0, 1]`. Occluder planes follow
 * `validateSolidPlanes`. The horizon rule is skipped while the sun or the
 * ground up has an unusable measured length. A finite vector whose Euclidean norm overflows is accepted by the collector's component checks but skips the horizon check; this is a remaining numerical admission gap.
 *
 * @evidence contracts/common.md#principled-implementation Accumulates violations in a `ViolationCollector`; id uniqueness and building-owned collisions are `Set` lookups, ordering compares each finite time with the previous finite one, and the horizon rule tests the sign of the dot product of the normalized sun and normalized ground up, which equals the sign of the sun's elevation and stays defined for components whose raw product would overflow.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the context rules with one private `usable` predicate that gates the horizon rule; non-blank strings, directions and the `[0, 1]` range use the shared collector checks, and occluder planes use `validateSolidPlanes`, the same rule `assertAutoMovieAnalysisSolids` applies to authored shades.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Meter units, schema version 1 and strict time order are contract rules. The horizon gate requires a finite measured norm; an overflowing norm of finite components can skip that gate without its own violation, so acceptance is not a complete horizon certificate at extreme magnitudes.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both governing rules and why ordering is not repaired, the return-not-throw behavior and `$input` root, the direction, unit, time, illuminance and humidity rules, and when the horizon rule is skipped; `reserved` states what it holds and what omission means.
 * @evidence contracts/performance.md#efficient-algorithms Time is O(R + I + O·P) for R reserved ids hashed into one set, I instants with constant work each, and O occluders of P planes; the ground up is normalized once per call rather than once per instant, and no pairwise comparison runs because uniqueness uses hashed sets.
 * @evidence contracts/performance.md#reuse-equivalent-work Nothing is memoized across calls: each daylight and envelope study and each production build validates the context it is handed, with its own `reserved` set, and a cache keyed on a mutable caller object could not prove the context unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector, the reserved, instant and occluder sets live only for the call; the returned validation holds the violations, which may reference fragments of the context, and is owned by the caller.
 * @author Samchon
 */
export const validateAutoMovieEnvironmentContext: (props: {
  context: IAutoMovieEnvironmentContext;
  reserved?: readonly string[];
}) => IAutoMovieValidation = (props: {
  /** Context to check. */
  context: IAutoMovieEnvironmentContext;

  /**
   * Ids the building already owns: elements, spaces, boundaries. A context id
   * colliding with one of these is refused; omitted reserves nothing.
   */
  reserved?: readonly string[];
}): IAutoMovieValidation => {
  const context: IAutoMovieEnvironmentContext = props.context;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";
  const reserved: Set<string> = new Set<string>(props.reserved ?? []);

  out.nonEmpty(`${root}.id`, context.id, "environment context id");
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
  if (!Number.isFinite(context.ground.elevation))
    out.push(
      "range",
      `${root}.ground.elevation`,
      `reference ground elevation must be finite, but was ${context.ground.elevation}`,
      context.ground.elevation,
    );
  const up: IAutoMovieVector3 | null = usable(context.ground.up)
    ? Vector3.normalize(context.ground.up)
    : null;

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
    out.nonEmpty(`${path}.id`, instant.id, "instant id");
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
    out.direction(`${path}.sun`, instant.sun, "sun direction");
    for (const [key, label] of [
      ["directNormalIlluminance", "direct normal illuminance"],
      ["diffuseHorizontalIlluminance", "diffuse horizontal illuminance"],
    ] as const)
      if (!Number.isFinite(instant[key]) || instant[key] < 0)
        out.push(
          "range",
          `${path}.${key}`,
          `${label} must be a finite number at or above zero, but was ${instant[key]}`,
          instant[key],
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
    if (
      up !== null &&
      usable(instant.sun) &&
      Number.isFinite(instant.directNormalIlluminance) &&
      instant.directNormalIlluminance > 0 &&
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
    out.nonEmpty(`${path}.id`, occluder.id, "occluder id");
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
};

/** Gate horizon arithmetic on a finite norm above 1e-12. This constant-space predicate can reject an overflowing finite-component norm that the collector admitted; it retains no vector or verdict. */
const usable: (value: IAutoMovieVector3) => boolean = (
  value: IAutoMovieVector3,
): boolean => {
  const length: number = Vector3.length(value);
  return Number.isFinite(length) && length > AXIS_EPSILON;
};
