/**
 * Shared by validateBuiltEnvironment, builtInstanceSetPlacementBounds, builtEnvironmentDescendantSpaces, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validatePopulationSet = (
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
  positive(
    set.variation.scale.min,
    `${path}.variation.scale.min`,
    "population minimum scale",
    collector,
  );
  positive(
    set.variation.scale.max,
    `${path}.variation.scale.max`,
    "population maximum scale",
    collector,
  );
  if (
    Number.isFinite(set.variation.scale.min) &&
    Number.isFinite(set.variation.scale.max) &&
    set.variation.scale.min > set.variation.scale.max
  )
    collector.push(
      "range",
      `${path}.variation.scale`,
      `population scale range must be ordered, but ${set.variation.scale.min} is above ${set.variation.scale.max}`,
      set.variation.scale,
    );
  if (set.variation.scale3 !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = {
        min: set.variation.scale3.min[axis],
        max: set.variation.scale3.max[axis],
      };
      positive(
        range.min,
        `${path}.variation.scale3.min.${axis}`,
        `population minimum ${axis} scale`,
        collector,
      );
      positive(
        range.max,
        `${path}.variation.scale3.max.${axis}`,
        `population maximum ${axis} scale`,
        collector,
      );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.scale3.${axis}`,
          `population ${axis} scale range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  if (set.variation.rotationDeg !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = set.variation.rotationDeg[axis];
      if (!Number.isFinite(range.min))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.min`,
          `population minimum ${axis} rotation must be finite, but was ${range.min}`,
          range.min,
        );
      if (!Number.isFinite(range.max))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.max`,
          `population maximum ${axis} rotation must be finite, but was ${range.max}`,
          range.max,
        );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}`,
          `population ${axis} rotation range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  const layout = set.layout;
  if (layout.kind === "along-route") {
    collector.push(
      "type",
      `${path}.layout.kind`,
      'a building population may not use the "along-route" layout: a route is a production-world fact this record carries no field for, so such a population belongs to the world rather than to a building space',
      layout.kind,
    );
    return;
  }
  if (layout.kind === "scatter") {
    positive(
      layout.radius,
      `${path}.layout.radius`,
      "population scatter radius",
      collector,
    );
    return;
  }
  if (layout.kind === "explicit") {
    if (layout.transforms.length < set.count)
      collector.push(
        "range",
        `${path}.layout.transforms`,
        `an explicit population needs one transform per slot, but ${layout.transforms.length} were stated for ${set.count} slots`,
        layout.transforms.length,
      );
    layout.transforms.forEach((transform, index) => {
      finiteVector(
        transform.translation,
        `${path}.layout.transforms[${index}].translation`,
        "population slot translation",
        collector,
      );
      unitQuaternion(
        transform.rotation,
        `${path}.layout.transforms[${index}].rotation`,
        "population slot rotation",
        collector,
      );
      for (const axis of ["x", "y", "z"] as const)
        positive(
          transform.scale[axis],
          `${path}.layout.transforms[${index}].scale.${axis}`,
          `population slot ${axis} scale`,
          collector,
        );
    });
    return;
  }
  positiveInteger(
    layout.rows,
    `${path}.layout.rows`,
    "population layout rows",
    collector,
  );
  positiveInteger(
    layout.columns,
    `${path}.layout.columns`,
    "population layout columns",
    collector,
  );
  positive(
    layout.spacing.x,
    `${path}.layout.spacing.x`,
    "population layout x spacing",
    collector,
  );
  positive(
    layout.spacing.z,
    `${path}.layout.spacing.z`,
    "population layout z spacing",
    collector,
  );
  if (layout.kind === "lattice") {
    positiveInteger(
      layout.layers,
      `${path}.layout.layers`,
      "population layout layers",
      collector,
    );
    positive(
      layout.spacing.y,
      `${path}.layout.spacing.y`,
      "population layout y spacing",
      collector,
    );
  }
  const capacity =
    layout.kind === "lattice"
      ? layout.rows * layout.columns * layout.layers
      : layout.rows * layout.columns;
  if (Number.isSafeInteger(capacity) && capacity < set.count)
    collector.push(
      "range",
      `${path}.layout`,
      `a ${layout.kind} population's own lattice holds ${capacity} slots, which cannot carry its ${set.count}`,
      capacity,
    );
};
