import {
  IAutoMovieBuiltPopulation,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieInstanceSetDesign,
  IAutoMovieQuaternion,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Check exactly what a building owns about one population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and it
 * validates it again when the lowered set reaches the world. What is checked
 * here is the subset a building record answers for on its own: the prototype
 * box, the slot count, and the placement law `builtInstanceSetPlacementBounds`
 * has to be total over, because a space query that cannot bound a population it
 * was handed would have to return either a lie or nothing at all.
 *
 * Violations are pushed under `${path}.prototypeBounds` and `${path}.set`, so
 * `validateBuiltEnvironment` reports them at the population's own record path
 * and `builtInstanceSetPlacementBounds` at `$input`. The prototype box must be
 * finite and ordered on every axis. The set needs a positive integer count, a
 * finite anchor and heading, positive and ordered scale ranges, finite and
 * ordered rotation ranges, and a layout that is not `along-route`, carries one
 * finite unit-rotation positive-scale transform per slot when explicit, a
 * positive scatter radius, or positive integer rows, columns and layers with
 * positive spacing and a capacity of at least the count. Nothing is thrown;
 * every defect becomes one violation.
 *
 * @param population The set and its prototype box, as a building records them.
 * @param path Path prefix the violations are reported under.
 * @param collector Collector the violations are appended to.
 */
export function validateBuiltPopulation(
  population: Pick<IAutoMovieBuiltPopulation, "set" | "prototypeBounds">,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  validatePrototypeBounds(
    population.prototypeBounds,
    `${path}.prototypeBounds`,
    collector,
  );
  validateSet(population.set, `${path}.set`, collector);
}

/** Largest deviation from unit norm a stated slot rotation may carry. */
const UNIT_QUATERNION_EPSILON: number = 1e-6;

/** The three world axes every vector check walks. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

const validatePrototypeBounds: (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: IAutoMovieViolationCollector,
): void => {
  for (const axis of AXES)
    ordered(
      bounds.min[axis],
      bounds.max[axis],
      `${path}.${axis}`,
      `population prototype ${axis} bounds`,
      collector,
    );
};

const validateSet: (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: IAutoMovieViolationCollector,
): void => {
  positiveInteger(
    set.count,
    `${path}.count`,
    "population slot count",
    collector,
  );
  validateVariation(set.variation, `${path}.variation`, collector);
  validateLayout(set, `${path}.layout`, collector);
};

const validateVariation: (
  variation: IAutoMovieInstanceSetDesign["variation"],
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  variation: IAutoMovieInstanceSetDesign["variation"],
  path: string,
  collector: IAutoMovieViolationCollector,
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
      ordered(
        range.min,
        range.max,
        `${path}.rotationDeg.${axis}`,
        `population ${axis} rotation range`,
        collector,
      );
    }
};

const validateLayout: (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: IAutoMovieViolationCollector,
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
    if (layout.ground !== undefined)
      collector.push(
        "type",
        `${path}.ground`,
        "a terrain-grounded scatter belongs to the production world; a building scatter uses its level anchor",
        layout.ground.kind,
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
  if (capacity < set.count)
    collector.push(
      "range",
      path,
      `a ${layout.kind} population's own lattice holds ${capacity} slots, which cannot carry its ${set.count}`,
      capacity,
    );
};

const positiveInteger: (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be an integer > 0, but was ${value}`,
      value,
    );
};

/** Report a range whose finite minimum lies above its finite maximum. */
const ordered: (
  min: number,
  max: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  min: number,
  max: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (min > max)
    collector.push(
      "range",
      path,
      `${label} must be ordered, but ${min} is above ${max}`,
      { min, max },
    );
};

/** A missing value is reported like a non-positive one, for unvalidated JSON. */
const positive: (
  value: number | undefined,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number | undefined,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (value === undefined || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value ?? null,
    );
};

const unitQuaternion: (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  const norm: number = Math.hypot(value.x, value.y, value.z, value.w);
  if (Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};
