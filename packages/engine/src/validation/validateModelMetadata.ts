/**
 * Model metadata admission shared by validateModel and texture identity checks.
 * Read caller-owned records and append diagnostics to their existing collector;
 * never trim IDs or repair a body or affordance. Identity and duplicate checks
 * preserve input order. Body mass is in kilograms and contact coefficients are dimensionless;
 * stack-top support is tested in the metre-space XZ plane only after finite
 * coordinates are established. Frame scalar admission stays with its shared
 * owner. These checks establish structural input facts, not contact stability.
 */
import type {
  IAutoMovieAffordance,
  IAutoMovieBody,
} from "@automovie/interface";

import { convexHull2D } from "../math/hull";
import { validateTransformScalars } from "./validateTransformScalars";
import { ViolationCollector } from "./violation";

/**
 * Validate one {@link IAutoMovieAffordance}: a non-empty id, finite frame
 * scalars, and extent semantics by kind: a `stack-top` needs a well-formed
 * supporting face (>= 3 finite, non-collinear plan points), while point-like
 * kinds (`handle` / `socket` / `hook`) must leave `extent` null. The closed
 * kind union makes an unknown kind structurally impossible.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Admits the finite interaction frame before checking point-like or planar support extent semantics.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Admits the finite interaction frame before checking point-like or planar support extent semantics.
 */
export const validateAffordance = (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: ViolationCollector,
): void => {
  validateNonEmptyId(affordance.id, `${path}.id`, "affordance id", collector);
  validateTransformScalars({
    transform: affordance.frame,
    path: `${path}.frame`,
    label: "affordance frame",
    collector,
  });

  if (affordance.kind !== "stack-top") {
    if (affordance.extent !== null)
      collector.push(
        "type",
        `${path}.extent`,
        `a "${affordance.kind}" affordance is point-like and must have extent null`,
        affordance.extent,
      );
    return;
  }

  const extent = affordance.extent;
  if (extent === null) {
    collector.push(
      "type",
      `${path}.extent`,
      'a "stack-top" affordance needs an extent polygon (the supporting face)',
      extent,
    );
    return;
  }
  if (extent.length < 3)
    collector.push(
      "type",
      `${path}.extent`,
      `a stack-top extent needs at least 3 points, but had ${extent.length}`,
      extent.length,
    );
  let planFinite = true;
  extent.forEach((point, i) => {
    for (const axis of ["x", "z"] as const)
      if (!Number.isFinite(point[axis])) {
        planFinite = false;
        collector.push(
          "range",
          `${path}.extent[${i}].${axis}`,
          `extent ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (planFinite && extent.length >= 3 && convexHull2D(extent).length < 3)
    collector.push(
      "type",
      `${path}.extent`,
      "stack-top extent points are collinear: they enclose no area",
      extent,
    );
};

/**
 * Validate an {@link IAutoMovieBody}'s rough scalars: mass must be finite and
 * strictly positive, `friction` and `restitution` sit in `[0, 1]`, and an
 * explicit `centerOfMass` must be finite on every axis.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Checks positive mass, bounded contact coefficients and a finite optional centre of mass as model semantic admission.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Checks positive mass, bounded contact coefficients and a finite optional centre of mass as model semantic admission.
 */
export const validateBody = (
  body: IAutoMovieBody,
  path: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(body.mass) || body.mass <= 0)
    collector.push(
      "range",
      `${path}.mass`,
      `mass must be a finite number > 0, but was ${body.mass}`,
      body.mass,
    );
  collector.range(`${path}.friction`, body.friction, 0, 1, "friction");
  collector.range(`${path}.restitution`, body.restitution, 0, 1, "restitution");
  if (body.centerOfMass !== null) {
    const com = body.centerOfMass;
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(com[axis]))
        collector.push(
          "range",
          `${path}.centerOfMass.${axis}`,
          `centerOfMass.${axis} must be finite, but was ${com[axis]}`,
          com[axis],
        );
  }
};

/**
 * Reports repeated model-scoped identities at their original diagnostic paths.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Retains the first identity and diagnoses subsequent duplicates at their original model paths.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Retains the first identity and diagnoses subsequent duplicates at their original model paths.
 */
export const validateUniqueValues = (
  entries: ReadonlyArray<readonly [string, string]>,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen = new Set<string>();
  for (const [value, entryPath] of entries) {
    if (seen.has(value))
      collector.push(
        "type",
        entryPath,
        `${label} "${value}" must be unique within the model`,
        value,
      );
    seen.add(value);
  }
};

/**
 * Reports non-string or blank identities without rewriting caller-owned resource names.
 * @evidence requirements/external-inputs/validation-and-quarantine.md#external-validation-structure-semantics Separates non-string and whitespace-only identities while leaving the caller's value unchanged.
 * @evidence specifications/interchange-and-adoption/validation-and-quarantine.md#interchange-layered-validation Separates non-string and whitespace-only identities while leaving the caller's value unchanged.
 */
export const validateNonEmptyId = (
  value: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (typeof value !== "string") {
    collector.push("type", path, `${label} must be a string`, value);
    return;
  }
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be a non-empty id`, value);
};
