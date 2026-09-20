import { IAutoMovieBuiltPopulation, IAutoMovieInstanceSetDesign, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";

/** Largest deviation from unit norm a stated quaternion may carry. */
const UNIT_QUATERNION_EPSILON = 1e-6;

/**
 * The world box one compact population and its prototype geometry occupy.
 *
 * The placement law and the authored local box are the two inputs. A grid and a
 * lattice contribute only their occupied hull corners, including a short final
 * row, so thousands of repeated members cost the same bounded fold as four. A
 * scatter contributes its declared disk rather than copying the seeded
 * materializer. The local box is then scaled and rotated about every slot.
 * Fixed rotations stay exact. A non-constant seeded rotation range contributes
 * the smallest origin-centred sphere enclosing every scaled local corner; that
 * conservative result cannot crop a member, and records that it is an authored
 * range rather than pretending to know which unexpanded slots sampled which
 * angles. Explicit transforms are already stored per member, so their exact
 * rotations and scales are folded directly and cost only the data the author
 * chose to store. Visibility variation never shrinks the result: this is the
 * declared population's occupied placement envelope, not a seed-expanded list
 * of the members visible in one render sample.
 *
 * `along-route` is refused: its slots follow a production-world route, and a
 * building record carries no field that can reach one. `validateBuiltEnvironment`
 * refuses such a population outright, so this throws only for a caller handing
 * over a world set directly.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `builtInstanceSetPlacementBounds` measures where a compact population stands so the space owning it can answer for it.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds `builtInstanceSetPlacementBounds` keeps the authored prototype-local box distinct from the world-space result derived after slot placement, rotation, and scale.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `builtInstanceSetPlacementBounds` derives the population's extent from the stored count, seed, and layout the specification allows compression to keep.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs `builtInstanceSetPlacementBounds` consumes an explicit model-local bound and returns the corresponding deterministic world-space placement bound.
 * @author Samchon
 */
export const builtInstanceSetPlacementBounds = (
  set: IAutoMovieInstanceSetDesign,
  prototypeBounds: IAutoMovieBuiltPopulation["prototypeBounds"],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const layout = set.layout;
  if (layout.kind === "along-route")
    throw new Error(
      `instance set "${set.id}" is placed along world route "${layout.route}", which a built environment carries no field to resolve`,
    );
  const collector = new ViolationCollector();
  validatePopulationPrototypeBounds(
    prototypeBounds,
    "$input.prototypeBounds",
    collector,
  );
  validatePopulationSet(set, "$input.set", collector);
  if (collector.items.length !== 0) {
    const first = collector.items[0]!;
    throw new RangeError(
      `instance set "${set.id}" cannot be bounded: ${first.path} ${first.expected}`,
    );
  }
  if (layout.kind === "explicit") {
    return boundsOf(
      layout.transforms.slice(0, set.count).flatMap((transform) => {
        const position = placeInstancePoint(set, transform.translation);
        const rotation = Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, set.facingDeg),
            transform.rotation,
          ),
        );
        return prototypeBoxCorners(prototypeBounds).map((corner) => {
          const offset = Quaternion.rotateVector(rotation, {
            x: corner.x * transform.scale.x,
            y: corner.y * transform.scale.y,
            z: corner.z * transform.scale.z,
          });
          return Vector3.add(position, offset);
        });
      }),
    );
  }
  const placement =
    layout.kind === "scatter"
      ? {
          min: {
            x: set.anchor.x - layout.radius,
            y: set.anchor.y,
            z: set.anchor.z - layout.radius,
          },
          max: {
            x: set.anchor.x + layout.radius,
            y: set.anchor.y,
            z: set.anchor.z + layout.radius,
          },
        }
      : boundsOf(
          instanceSetExtremeSlots(set, layout).map((point) =>
            placeInstancePoint(set, point),
          ),
        );
  const offset = populationPrototypeOffsetBounds(set, prototypeBounds);
  return {
    min: Vector3.add(placement.min, offset.min),
    max: Vector3.add(placement.max, offset.max),
  };
};

/** Place one layout-local point under the set's anchor and base heading. */
const placeInstancePoint = (
  set: IAutoMovieInstanceSetDesign,
  point: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const radians = (set.facingDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: set.anchor.x + point.x * cosine + point.z * sine,
    y: set.anchor.y + point.y,
    z: set.anchor.z - point.x * sine + point.z * cosine,
  };
};

/** The eight corners of one model-local box, duplicates included when flat. */
const prototypeBoxCorners = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
): IAutoMovieVector3[] =>
  [bounds.min.x, bounds.max.x].flatMap((x) =>
    [bounds.min.y, bounds.max.y].flatMap((y) =>
      [bounds.min.z, bounds.max.z].map((z) => ({ x, y, z })),
    ),
  );

/** The prototype offset shared by every compact, non-explicit layout slot. */
const populationPrototypeOffsetBounds = (
  set: IAutoMovieInstanceSetDesign,
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const scaleRange = set.variation.scale3;
  const scales =
    scaleRange === undefined
      ? [set.variation.scale.min, set.variation.scale.max].map((scale) => ({
          x: scale,
          y: scale,
          z: scale,
        }))
      : [scaleRange.min.x, scaleRange.max.x].flatMap((x) =>
          [scaleRange.min.y, scaleRange.max.y].flatMap((y) =>
            [scaleRange.min.z, scaleRange.max.z].map((z) => ({ x, y, z })),
          ),
        );
  const rotationRange = set.variation.rotationDeg;
  const rotationVaries =
    rotationRange !== undefined &&
    (rotationRange.x.min !== rotationRange.x.max ||
      rotationRange.y.min !== rotationRange.y.max ||
      rotationRange.z.min !== rotationRange.z.max);
  if (rotationVaries) {
    let radius = 0;
    for (const corner of prototypeBoxCorners(bounds))
      for (const scale of scales)
        radius = Math.max(
          radius,
          Math.hypot(
            corner.x * scale.x,
            corner.y * scale.y,
            corner.z * scale.z,
          ),
        );
    return {
      min: { x: -radius, y: -radius, z: -radius },
      max: { x: radius, y: radius, z: radius },
    };
  }
  const variationRotation =
    rotationRange === undefined
      ? Quaternion.identity()
      : Quaternion.fromEuler({
          x: rotationRange.x.min,
          y: rotationRange.y.min,
          z: rotationRange.z.min,
          order: "XYZ",
        });
  const rotation = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, set.facingDeg),
      variationRotation,
    ),
  );
  return boundsOf(
    prototypeBoxCorners(bounds).flatMap((corner) =>
      scales.map((scale) =>
        Quaternion.rotateVector(rotation, {
          x: corner.x * scale.x,
          y: corner.y * scale.y,
          z: corner.z * scale.z,
        }),
      ),
    ),
  );
};

/**
 * The set-local points that can carry a deterministic layout's extremes.
 *
 * A rotated point set's world box is the box of its convex hull's corners, so a
 * lattice needs its corners rather than its slots. The last row of a grid may be
 * short, which is why the corner list is not simply four: the hull then has the
 * full rows' far corner and the short row's own end, and taking the full
 * rectangle instead would report a column of slate nobody laid.
 */
const instanceSetExtremeSlots = (
  set: IAutoMovieInstanceSetDesign,
  layout: Exclude<
    IAutoMovieInstanceSetDesign["layout"],
    { kind: "along-route" } | { kind: "explicit" } | { kind: "scatter" }
  >,
): IAutoMovieVector3[] => {
  const perLayer = layout.rows * layout.columns;
  const layers =
    layout.kind === "lattice" ? Math.ceil(set.count / perLayer) : 1;
  const withinLayer =
    layers > 1 ? perLayer : Math.min(set.count, layout.rows * layout.columns);
  const top = layout.kind === "lattice" ? (layers - 1) * layout.spacing.y : 0;
  return gridExtremeCells(withinLayer, layout.columns).flatMap((cell) =>
    (top === 0 ? [0] : [0, top]).map((y) => ({
      x: (cell.column - (layout.columns - 1) / 2) * layout.spacing.x,
      y,
      z: cell.row * layout.spacing.z,
    })),
  );
};

/** The hull corners of `count` slots laid row-major into `columns` columns. */
const gridExtremeCells = (
  count: number,
  columns: number,
): Array<{ column: number; row: number }> => {
  const rows = Math.ceil(count / columns);
  const last = count - (rows - 1) * columns;
  if (rows === 1)
    return [
      { column: 0, row: 0 },
      { column: last - 1, row: 0 },
    ];
  return [
    { column: 0, row: 0 },
    { column: columns - 1, row: 0 },
    { column: 0, row: rows - 1 },
    { column: last - 1, row: rows - 1 },
    ...(last === columns ? [] : [{ column: columns - 1, row: rows - 2 }]),
  ];
};

/**
 * Check exactly what a building owns about a population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and
 * it validates it again when the lowered set reaches the world. What is checked
 * here is the subset this record answers for on its own: the slot count and the
 * placement law {@link builtInstanceSetPlacementBounds} has to be total over,
 * because a space query that cannot bound a population it was handed would have
 * to return either a lie or nothing at all.
 */
const validatePopulationPrototypeBounds = (
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
  for (const axis of ["x", "y", "z"] as const)
    if (
      Number.isFinite(bounds.min[axis]) &&
      Number.isFinite(bounds.max[axis]) &&
      bounds.min[axis] > bounds.max[axis]
    )
      collector.push(
        "range",
        `${path}.${axis}`,
        `population prototype ${axis} bounds must be ordered, but ${bounds.min[axis]} is above ${bounds.max[axis]}`,
        { min: bounds.min[axis], max: bounds.max[axis] },
      );
};

const validatePopulationSet = (
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

const positiveInteger = (
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

const finiteVector = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
};

const positive = (
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

const unitQuaternion = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};

/**
 * The axis-aligned box containing every given point.
 *
 * Folded rather than spread through `Math.min`, because the callers are no
 * longer only the four corners of a leaf: measuring a space's contents hands
 * this every vertex the space draws, and a spread of that many arguments is a
 * stack overflow rather than a slow answer.
 */
const boundsOf = (
  points: readonly IAutoMovieVector3[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    min.x = Math.min(min.x, point.x);
    min.y = Math.min(min.y, point.y);
    min.z = Math.min(min.z, point.z);
    max.x = Math.max(max.x, point.x);
    max.y = Math.max(max.y, point.y);
    max.z = Math.max(max.z, point.z);
  }
  return { min, max };
};
