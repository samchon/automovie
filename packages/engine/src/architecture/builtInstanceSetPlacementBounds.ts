import {
  IAutoMovieBuiltPopulation,
  IAutoMovieConstraintViolation,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieInstanceSetDesign,
  IAutoMovieQuaternion,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { builtPointBounds } from "./builtPointBounds";
import { validateBuiltPopulation } from "./validateBuiltPopulation";

/** The world up axis every population heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A grid or lattice layout, the two kinds bounded by their hull slots. */
type IGridLayout = Extract<
  IAutoMovieInstanceSetDesign["layout"],
  { kind: "grid" } | { kind: "lattice" }
>;

/**
 * The world box one compact population and its prototype geometry occupy.
 *
 * The placement law and authored prototype-local box define an envelope. Grid and lattice folds use occupied hull slots, including a short final row; scatter uses its declared disk, independent of realized seed samples. Prototype-box corners use fixed rotations directly, or an enclosing origin-centred sphere for a varying rotation range. Explicit layouts fold the first count stored transforms, while validation reads all stored transforms. These envelopes may include empty space, and binary64 arithmetic is not outward rounded. Visibility variation does not shrink the envelope.
 *
 * `along-route` throws an `Error`: its slots follow a production-world route, and a building record carries no field that can reach one. `validateBuiltEnvironment` refuses such a population outright, so this throws only for a caller handing over a world set directly.
 *
 * Every other input is checked by {@link validateBuiltPopulation}, the same rules the building validator applies, and the first violation is thrown as a `RangeError` naming its path under `$input`. The box is world-space, in metres, and inclusive.
 *
 * @param set The population's instance-set design.
 * @param prototypeBounds The prototype's model-local box, in metres.
 * @returns A new world box enclosing every member the set can place.
 *
 * @evidence contracts/common.md#principled-implementation Uses occupied grid/lattice hull slots, a scatter disk envelope and transformed prototype-box corners. Fixed rotations preserve the stated box envelope; variable rotations use an origin-centred enclosing sphere. Scatter and variation envelopes can exceed the realized seeded members, and prototype boxes can exceed mesh geometry; binary64 evaluation is not an outward-rounded enclosure proof.
 * @evidence contracts/common.md#clear-and-simple-design The fold handles one population per call: validation is delegated to `validateBuiltPopulation`, shared with `validateBuiltEnvironment`, and the point fold to `builtPointBounds`, so this file keeps only the placement law it bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the placement law instead of materializing seeded members, and names no set or layout instance; the `along-route` refusal is the contract's statement that a building cannot reach a world route.
 * @evidence contracts/common.md#meaningful-documentation States each envelope law, the seeded-member and numerical limitations, the distinction between validating all stored explicit transforms and folding only count, visibility treatment, error types and paths, and the world frame and metre unit.
 * @evidence contracts/performance.md#efficient-algorithms Compact grid, lattice and scatter corner folds are independent of count. An explicit layout validates all T stored transforms, then folds eight corners for each of the first count transforms, costing O(T + count) time and O(count) temporary corner storage, plus any violation records produced by validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call bounds one population from its own record; the record is the caller's mutable data, so a cached box could not prove it still matches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Compact layouts allocate a bounded corner set; explicit layouts allocate O(count) transformed corners and validation can collect O(T) findings. These temporaries and the collector become unreachable on return or throw; only the returned box escapes.
 * @author Samchon
 */
export const builtInstanceSetPlacementBounds: (
  set: IAutoMovieInstanceSetDesign,
  prototypeBounds: IAutoMovieBuiltPopulation["prototypeBounds"],
) => IAutoMovieSubjectBox = (
  set: IAutoMovieInstanceSetDesign,
  prototypeBounds: IAutoMovieBuiltPopulation["prototypeBounds"],
): IAutoMovieSubjectBox => {
  const layout: IAutoMovieInstanceSetDesign["layout"] = set.layout;
  if (layout.kind === "along-route")
    throw new Error(
      `instance set "${set.id}" is placed along world route "${layout.route}", which a built environment carries no field to resolve`,
    );
  const collector: ViolationCollector = new ViolationCollector();
  validateBuiltPopulation({ set, prototypeBounds }, "$input", collector);
  const first: IAutoMovieConstraintViolation | undefined = collector.items[0];
  if (first !== undefined)
    throw new RangeError(
      `instance set "${set.id}" cannot be bounded: ${first.path} ${first.expected}`,
    );
  const corners: IAutoMovieVector3[] = prototypeBoxCorners(prototypeBounds);
  if (layout.kind === "explicit")
    return builtPointBounds(
      layout.transforms
        .slice(0, set.count)
        .flatMap(
          (
            transform: IAutoMovieExplicitInstanceTransform,
          ): IAutoMovieVector3[] => {
            const position: IAutoMovieVector3 = placeInstancePoint(
              set,
              transform.translation,
            );
            const rotation: IAutoMovieQuaternion = Quaternion.normalize(
              Quaternion.multiply(
                Quaternion.fromAxisAngle(UP, set.facingDeg),
                transform.rotation,
              ),
            );
            return corners.map(
              (corner: IAutoMovieVector3): IAutoMovieVector3 =>
                Vector3.add(
                  position,
                  Quaternion.rotateVector(
                    rotation,
                    scaled(corner, transform.scale),
                  ),
                ),
            );
          },
        ),
    )!;
  const placement: IAutoMovieSubjectBox =
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
      : builtPointBounds(
          instanceSetExtremeSlots(set, layout).map(
            (point: IAutoMovieVector3): IAutoMovieVector3 =>
              placeInstancePoint(set, point),
          ),
        )!;
  const offset: IAutoMovieSubjectBox = prototypeOffsetBounds(set, corners);
  return {
    min: Vector3.add(placement.min, offset.min),
    max: Vector3.add(placement.max, offset.max),
  };
};

/** Place one layout-local point under the set's anchor and base heading. */
const placeInstancePoint: (
  set: IAutoMovieInstanceSetDesign,
  point: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  set: IAutoMovieInstanceSetDesign,
  point: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const radians: number = (set.facingDeg * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: set.anchor.x + point.x * cosine + point.z * sine,
    y: set.anchor.y + point.y,
    z: set.anchor.z - point.x * sine + point.z * cosine,
  };
};

/** Scale one model-local point per axis. */
const scaled: (
  point: IAutoMovieVector3,
  scale: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  point: IAutoMovieVector3,
  scale: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: point.x * scale.x,
  y: point.y * scale.y,
  z: point.z * scale.z,
});

/** The eight corners of one model-local box, duplicates included when flat. */
const prototypeBoxCorners: (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
) => IAutoMovieVector3[] = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
): IAutoMovieVector3[] => boxCorners(bounds.min, bounds.max);

/** Every combination of per-axis extremes between two corners. */
const boxCorners: (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
) => IAutoMovieVector3[] = (
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieVector3[] =>
  [min.x, max.x].flatMap((x: number): IAutoMovieVector3[] =>
    [min.y, max.y].flatMap((y: number): IAutoMovieVector3[] =>
      [min.z, max.z].map((z: number): IAutoMovieVector3 => ({ x, y, z })),
    ),
  );

/** The prototype offset shared by every compact, non-explicit layout slot. */
const prototypeOffsetBounds: (
  set: IAutoMovieInstanceSetDesign,
  corners: readonly IAutoMovieVector3[],
) => IAutoMovieSubjectBox = (
  set: IAutoMovieInstanceSetDesign,
  corners: readonly IAutoMovieVector3[],
): IAutoMovieSubjectBox => {
  const scaleRange: IAutoMovieInstanceSetDesign["variation"]["scale3"] =
    set.variation.scale3;
  const scales: IAutoMovieVector3[] =
    scaleRange === undefined
      ? [set.variation.scale.min, set.variation.scale.max].map(
          (scale: number): IAutoMovieVector3 => ({
            x: scale,
            y: scale,
            z: scale,
          }),
        )
      : boxCorners(scaleRange.min, scaleRange.max);
  const rotationRange: IAutoMovieInstanceSetDesign["variation"]["rotationDeg"] =
    set.variation.rotationDeg;
  const rotationVaries: boolean =
    rotationRange !== undefined &&
    (rotationRange.x.min !== rotationRange.x.max ||
      rotationRange.y.min !== rotationRange.y.max ||
      rotationRange.z.min !== rotationRange.z.max);
  if (rotationVaries) {
    let radius: number = 0;
    for (const corner of corners)
      for (const scale of scales) {
        const reach: IAutoMovieVector3 = scaled(corner, scale);
        radius = Math.max(radius, Math.hypot(reach.x, reach.y, reach.z));
      }
    return {
      min: { x: -radius, y: -radius, z: -radius },
      max: { x: radius, y: radius, z: radius },
    };
  }
  const variationRotation: IAutoMovieQuaternion =
    rotationRange === undefined
      ? Quaternion.identity()
      : Quaternion.fromEuler({
          x: rotationRange.x.min,
          y: rotationRange.y.min,
          z: rotationRange.z.min,
          order: "XYZ",
        });
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.fromAxisAngle(UP, set.facingDeg),
      variationRotation,
    ),
  );
  return builtPointBounds(
    corners.flatMap((corner: IAutoMovieVector3): IAutoMovieVector3[] =>
      scales.map(
        (scale: IAutoMovieVector3): IAutoMovieVector3 =>
          Quaternion.rotateVector(rotation, scaled(corner, scale)),
      ),
    ),
  )!;
};

/**
 * The set-local points that can carry a deterministic layout's extremes.
 *
 * A rotated point set's world box is the box of its convex hull's corners, so a lattice needs its corners rather than its slots. The last row of a grid may be short, which is why the corner list is not simply four: the hull then has the full rows' far corner and the short row's own end, and taking the full rectangle instead would report a column of slate nobody laid. A lattice's top layer reuses the full layer's corners; the heading turns only about the vertical, so the full layer below already sets the horizontal extent.
 */
const instanceSetExtremeSlots: (
  set: IAutoMovieInstanceSetDesign,
  layout: IGridLayout,
) => IAutoMovieVector3[] = (
  set: IAutoMovieInstanceSetDesign,
  layout: IGridLayout,
): IAutoMovieVector3[] => {
  const perLayer: number = layout.rows * layout.columns;
  const layers: number =
    layout.kind === "lattice" ? Math.ceil(set.count / perLayer) : 1;
  const withinLayer: number =
    layers > 1 ? perLayer : Math.min(set.count, perLayer);
  const top: number =
    layout.kind === "lattice" ? (layers - 1) * layout.spacing.y : 0;
  const heights: number[] = top === 0 ? [0] : [0, top];
  return gridExtremeCells(withinLayer, layout.columns).flatMap(
    (cell: { column: number; row: number }): IAutoMovieVector3[] =>
      heights.map(
        (y: number): IAutoMovieVector3 => ({
          x: (cell.column - (layout.columns - 1) / 2) * layout.spacing.x,
          y,
          z: cell.row * layout.spacing.z,
        }),
      ),
  );
};

/** The hull corners of `count` slots laid row-major into `columns` columns. */
const gridExtremeCells: (
  count: number,
  columns: number,
) => Array<{ column: number; row: number }> = (
  count: number,
  columns: number,
): Array<{ column: number; row: number }> => {
  const rows: number = Math.ceil(count / columns);
  const last: number = count - (rows - 1) * columns;
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
