import { IAutoMovieBuiltPopulation, IAutoMovieInstanceSetDesign, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";

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

/** Every world point one drawn part contributes. */
const placedPartPoints = (
  part: IAutoMovieModel["parts"][number],
  world: number[],
): IAutoMovieVector3[] => {
  const points: IAutoMovieVector3[] = [];
  const positions =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape).positions
      : part.geometry.mesh.positions;
  const matrix =
    part.transform === null
      ? world
      : Matrix4.multiply(
          world,
          Matrix4.compose(
            part.transform.translation,
            part.transform.rotation,
            part.transform.scale,
          ),
        );
  for (let index = 0; index + 2 < positions.length; index += 3)
    points.push(
      applyMatrix(matrix, {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      }),
    );
  return points;
};

/**
 * The world points one placed element draws, or its origin when it draws none.
 *
 * Parts are placed the way the renderer places them, each under its own
 * transform and then under the element's world matrix. A model the environment
 * does not own is `undefined` here rather than an error, because a runtime
 * model reference is a legal way to furnish a building and the record simply
 * does not carry its vertices.
 */
const placedElementPoints = (
  model: IAutoMovieModel | undefined,
  world: number[],
): IAutoMovieVector3[] => {
  const points = (model === undefined ? [] : model.parts).flatMap((part) =>
    placedPartPoints(part, world),
  );
  return points.length === 0
    ? [applyMatrix(world, { x: 0, y: 0, z: 0 })]
    : points;
};

/**
 * One world box per drawn part, rather than one box over all of them.
 *
 * A model's union box says where the body is and nothing about how much of that
 * volume it fills. A shelf is a back panel and two boards, so its union spans
 * floor to head height and is mostly air; anything standing on a board is
 * inside that box, and a test written against the union reports an overlap that
 * is true about the boxes and false about the bodies. The same box puts the
 * bearing face at the panel's top rather than at the board the object rests on,
 * which is the paired "floating" answer.
 *
 * Part boxes are contained in the union box, so every answer they give is one
 * the union would also have given or a false positive the union invented. A
 * single-part body yields exactly the union box and behaves as before.
 *
 * An element with no drawn part keeps its degenerate origin box, for the reason
 * {@link builtEnvironmentElementBounds} states.
 */
const placedPartBoxes = (
  model: IAutoMovieModel | undefined,
  world: number[],
): { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] => {
  const boxes: { min: IAutoMovieVector3; max: IAutoMovieVector3 }[] = [];
  for (const part of model === undefined ? [] : model.parts) {
    const points = placedPartPoints(part, world);
    if (points.length !== 0) boxes.push(boundsOf(points));
  }
  return boxes.length === 0
    ? [boundsOf([applyMatrix(world, { x: 0, y: 0, z: 0 })])]
    : boxes;
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

/** Every world point one drawn part contributes. */
const placedPartPoints = (
  part: IAutoMovieModel["parts"][number],
  world: number[],
): IAutoMovieVector3[] => {
  const points: IAutoMovieVector3[] = [];
  const positions =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape).positions
      : part.geometry.mesh.positions;
  const matrix =
    part.transform === null
      ? world
      : Matrix4.multiply(
          world,
          Matrix4.compose(
            part.transform.translation,
            part.transform.rotation,
            part.transform.scale,
          ),
        );
  for (let index = 0; index + 2 < positions.length; index += 3)
    points.push(
      applyMatrix(matrix, {
        x: positions[index]!,
        y: positions[index + 1]!,
        z: positions[index + 2]!,
      }),
    );
  return points;
};
