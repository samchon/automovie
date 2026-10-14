import {
  IAutoMovieBuiltPopulation,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieInstanceSetDesign,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/** Largest deviation from unit norm a stated slot rotation may carry. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/** The three world axes every vector check walks. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/**
 * Check exactly what a building owns about one population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and
 * it validates it again when the lowered set reaches the world. What is checked
 * here is the subset a building record answers for on its own: the prototype
 * box, the slot count, and the placement law `builtInstanceSetPlacementBounds`
 * has to be total over, because a space query that cannot bound a population
 * it was handed would have to return either a lie or nothing at all.
 *
 * Violations are pushed under `${path}.prototypeBounds` and `${path}.set`, so
 * `validateBuiltEnvironment` reports them at the population's own record path
 * and `builtInstanceSetPlacementBounds` at `$input`. The prototype box must
 * be finite and ordered on every axis. The set needs a positive integer count,
 * a finite anchor and heading, positive and ordered scale ranges, finite and
 * ordered rotation ranges, and a layout that is not `along-route`, carries one
 * finite unit-rotation positive-scale transform per slot when explicit, a
 * positive scatter radius, or positive integer rows, columns and layers with
 * positive spacing and a capacity of at least the count. Nothing is thrown;
 * every defect becomes one violation.
 *
 * @param population The set and its prototype box, as a building records them.
 * @param path Path prefix the violations are reported under.
 * @param collector Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Checks safe-integer counts, finite coordinates, positive scales/spacings and finite ordered ranges. Slot quaternion norms use `Math.hypot` with a fixed `1e-6` accepted discrepancy; it is a normalization policy, not a universal serialization-error bound. Range ordering is compared only after both endpoints are finite.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the population subset of the building contract and is called by both the record validator and the bounds fold, which previously kept two identical copies; small private checks keep each rule's path and message in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no population or layout instance; `along-route` is refused as a kind because a building record has no field that can reach a production route, which is a contract difference rather than a special case.
 * @evidence contracts/common.md#meaningful-documentation States what subset is checked and why the production builder owns the rest, the two path prefixes and who uses them, every rule per field and layout kind, and that defects are collected rather than thrown.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the explicit transform count and constant otherwise; one pass with no allocation beyond the violations it records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A synchronous check of one population that coordinates no work across calls; each caller validates the record it was handed.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; violations go into the caller's collector, which the caller owns.
 */
export const validateBuiltPopulation: (population: Pick<IAutoMovieBuiltPopulation, "set" | "prototypeBounds">, path: string, collector: ViolationCollector) => void = (
  population: Pick<IAutoMovieBuiltPopulation, "set" | "prototypeBounds">,
  path: string,
  collector: ViolationCollector,
): void => {
  validatePrototypeBounds(
    population.prototypeBounds,
    `${path}.prototypeBounds`,
    collector,
  );
  validateSet(population.set, `${path}.set`, collector);
};

const validatePrototypeBounds: (bounds: IAutoMovieBuiltPopulation["prototypeBounds"], path: string, collector: ViolationCollector) => void = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: ViolationCollector,
): void => {
  finiteVector(
    bounds.min,
    `${path}.min`,
    "population prototype minimum",
    collector,
  );
  finiteVector(
    bounds.max,
    `${path}.max`,
    "population prototype maximum",
    collector,
  );
  for (const axis of AXES)
    ordered(
      bounds.min[axis],
      bounds.max[axis],
      `${path}.${axis}`,
      `population prototype ${axis} bounds`,
      collector,
    );
};

const validateSet: (set: IAutoMovieInstanceSetDesign, path: string, collector: ViolationCollector) => void = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: ViolationCollector,
): void => {
  positiveInteger(
    set.count,
    `${path}.count`,
    "population slot count",
    collector,
  );
  finiteVector(set.anchor, `${path}.anchor`, "population anchor", collector);
  if (!Number.isFinite(set.facingDeg))
    collector.push(
      "range",
      `${path}.facingDeg`,
      `population heading must be finite, but was ${set.facingDeg}`,
      set.facingDeg,
    );
  validateVariation(set.variation, `${path}.variation`, collector);
  validateLayout(set, `${path}.layout`, collector);
};

const validateVariation: (variation: IAutoMovieInstanceSetDesign["variation"], path: string, collector: ViolationCollector) => void = (
  variation: IAutoMovieInstanceSetDesign["variation"],
  path: string,
  collector: ViolationCollector,
): void => {
  positive(
    variation.scale.min,
    `${path}.scale.min`,
    "population minimum scale",
    collector,
  );
  positive(
    variation.scale.max,
    `${path}.scale.max`,
    "population maximum scale",
    collector,
  );
  ordered(
    variation.scale.min,
    variation.scale.max,
    `${path}.scale`,
    "population scale range",
    collector,
  );
  const scale3: IAutoMovieInstanceSetDesign["variation"]["scale3"] =
    variation.scale3;
  if (scale3 !== undefined)
    for (const axis of AXES) {
      positive(
        scale3.min[axis],
        `${path}.scale3.min.${axis}`,
        `population minimum ${axis} scale`,
        collector,
      );
      positive(
        scale3.max[axis],
        `${path}.scale3.max.${axis}`,
        `population maximum ${axis} scale`,
        collector,
      );
      ordered(
        scale3.min[axis],
        scale3.max[axis],
        `${path}.scale3.${axis}`,
        `population ${axis} scale range`,
        collector,
      );
    }
  const rotation: IAutoMovieInstanceSetDesign["variation"]["rotationDeg"] =
    variation.rotationDeg;
  if (rotation !== undefined)
    for (const axis of AXES) {
      const range: { min: number; max: number } = rotation[axis];
      finiteNumber(
        range.min,
        `${path}.rotationDeg.${axis}.min`,
        `population minimum ${axis} rotation`,
        collector,
      );
      finiteNumber(
        range.max,
        `${path}.rotationDeg.${axis}.max`,
        `population maximum ${axis} rotation`,
        collector,
      );
      ordered(
        range.min,
        range.max,
        `${path}.rotationDeg.${axis}`,
        `population ${axis} rotation range`,
        collector,
      );
    }
};

const validateLayout: (set: IAutoMovieInstanceSetDesign, path: string, collector: ViolationCollector) => void = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: ViolationCollector,
): void => {
  const layout: IAutoMovieInstanceSetDesign["layout"] = set.layout;
  if (layout.kind === "along-route") {
    collector.push(
      "type",
      `${path}.kind`,
      'a building population may not use the "along-route" layout: a route is a production-world fact this record carries no field for, so such a population belongs to the world rather than to a building space',
      layout.kind,
    );
    return;
  }
  if (layout.kind === "scatter") {
    positive(
      layout.radius,
      `${path}.radius`,
      "population scatter radius",
      collector,
    );
    return;
  }
  if (layout.kind === "explicit") {
    if (layout.transforms.length < set.count)
      collector.push(
        "range",
        `${path}.transforms`,
        `an explicit population needs one transform per slot, but ${layout.transforms.length} were stated for ${set.count} slots`,
        layout.transforms.length,
      );
    layout.transforms.forEach(
      (transform: IAutoMovieExplicitInstanceTransform, index: number): void => {
        const at: string = `${path}.transforms[${index}]`;
        finiteVector(
          transform.translation,
          `${at}.translation`,
          "population slot translation",
          collector,
        );
        unitQuaternion(
          transform.rotation,
          `${at}.rotation`,
          "population slot rotation",
          collector,
        );
        for (const axis of AXES)
          positive(
            transform.scale[axis],
            `${at}.scale.${axis}`,
            `population slot ${axis} scale`,
            collector,
          );
      },
    );
    return;
  }
  positiveInteger(
    layout.rows,
    `${path}.rows`,
    "population layout rows",
    collector,
  );
  positiveInteger(
    layout.columns,
    `${path}.columns`,
    "population layout columns",
    collector,
  );
  positive(
    layout.spacing.x,
    `${path}.spacing.x`,
    "population layout x spacing",
    collector,
  );
  positive(
    layout.spacing.z,
    `${path}.spacing.z`,
    "population layout z spacing",
    collector,
  );
  if (layout.kind === "lattice") {
    positiveInteger(
      layout.layers,
      `${path}.layers`,
      "population layout layers",
      collector,
    );
    positive(
      layout.spacing.y,
      `${path}.spacing.y`,
      "population layout y spacing",
      collector,
    );
  }
  const capacity: number =
    layout.kind === "lattice"
      ? layout.rows * layout.columns * layout.layers
      : layout.rows * layout.columns;
  if (Number.isSafeInteger(capacity) && capacity < set.count)
    collector.push(
      "range",
      path,
      `a ${layout.kind} population's own lattice holds ${capacity} slots, which cannot carry its ${set.count}`,
      capacity,
    );
};

const positiveInteger: (value: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isSafeInteger(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be an integer > 0, but was ${value}`,
      value,
    );
};

const finiteNumber: (value: number, path: string, label: string, collector: ViolationCollector) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value))
    collector.push(
      "range",
      path,
      `${label} must be finite, but was ${value}`,
      value,
    );
};

const finiteVector: (value: IAutoMovieVector3, path: string, label: string, collector: ViolationCollector) => void = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  for (const axis of AXES)
    finiteNumber(value[axis], `${path}.${axis}`, `${label} ${axis}`, collector);
};

/** Report a range whose finite minimum lies above its finite maximum. */
const ordered: (min: number, max: number, path: string, label: string, collector: ViolationCollector) => void = (
  min: number,
  max: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Number.isFinite(min) && Number.isFinite(max) && min > max)
    collector.push(
      "range",
      path,
      `${label} must be ordered, but ${min} is above ${max}`,
      { min, max },
    );
};

/** A missing value is reported like a non-positive one, for unvalidated JSON. */
const positive: (value: number | undefined, path: string, label: string, collector: ViolationCollector) => void = (
  value: number | undefined,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value === undefined || !Number.isFinite(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value ?? null,
    );
};

const unitQuaternion: (value: IAutoMovieQuaternion, path: string, label: string, collector: ViolationCollector) => void = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const norm: number = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};
