import type {
  AutoMoviePrimitiveShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";

/** A primitive in its own axes: volume, centroid and central principal inertia per unit mass. */
interface ILocal {
  /** Volume, cubic metres. */
  volume: number;

  /** Centroid in the primitive's coordinates, metres. */
  centroid: IAutoMovieVector3;

  /** Central moments about the primitive's axes per unit mass, square metres. */
  unit: IAutoMovieVector3;
}

/**
 * A primitive's volume, centre and central moments per unit mass in its own axes.
 * Local volume must be finite and positive, and local principal moments finite
 * and positive; geometries outside that local representable domain are refused.
 *
 * @param shape The primitive.
 * @returns Its volume, centroid and central inertia per unit mass.
 * @throws {Error} For invalid dimensions or unrepresentable local properties.
 * @evidence contracts/development/common.md#meaningful-documentation States SI dimensions, local frame, planar null result and finite representability premises.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form uniform box, sphere, cylinder, cone and cylinder-plus-two-hemisphere capsule properties, the same solids used by rendering. Capsule moments use component volume fractions before multiplication; scaled products preserve finite volume and principal-moment results across intermediate overflow.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit dimensions, dispatch one closed form, then admit finite positive volume and finite positive principal moments for nondegenerate solids.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses unrepresentable local properties rather than substituting a density, size cap, zero volume, zero local moment from underflow or approximate tensor; a plane still contributes no solid.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of scalar operations per primitive, with fixed-width exceptional arithmetic through ArchetypeMassArithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One local record supplies volume, centroid and all principal moments to of and parts.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned scalar record retains no input, resource or cache.
 */
export function ArchetypeMassPrimitive(
  shape: AutoMoviePrimitiveShape,
): ILocal | null {
  for (const [name, value] of Object.entries(shape))
    if (
      name !== "type" &&
      !(typeof value === "number" && Number.isFinite(value) && value > 0)
    )
      throw new Error(
        `Mass primitive ${shape.type} needs finite positive ${name}`,
      );
  const result: ILocal | null = evaluate(shape);
  if (
    result !== null &&
    !(
      Number.isFinite(result.volume) &&
      result.volume > 0 &&
      Number.isFinite(result.centroid.x) &&
      Number.isFinite(result.centroid.y) &&
      Number.isFinite(result.centroid.z) &&
      Number.isFinite(result.unit.x) &&
      result.unit.x > 0 &&
      Number.isFinite(result.unit.y) &&
      result.unit.y > 0 &&
      Number.isFinite(result.unit.z) &&
      result.unit.z > 0
    )
  )
    throw new Error(
      `Mass primitive ${shape.type} needs representable finite volume and principal moments`,
    );
  return result;
}

/** Uniform-solid formulas in the primitive's axes. */
function evaluate(shape: AutoMoviePrimitiveShape): ILocal | null {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  switch (shape.type) {
    case "box":
      return {
        volume: ArchetypeMassArithmetic.product(
          shape.width,
          shape.height,
          shape.depth,
        ),
        centroid: zero,
        unit: {
          x: transverse(shape.height, shape.depth),
          y: transverse(shape.width, shape.depth),
          z: transverse(shape.width, shape.height),
        },
      };
    case "sphere":
      return {
        volume: ArchetypeMassArithmetic.product(
          (4 / 3) * Math.PI,
          shape.radius,
          shape.radius,
          shape.radius,
        ),
        centroid: zero,
        unit: {
          x: ArchetypeMassArithmetic.product(0.4, shape.radius, shape.radius),
          y: ArchetypeMassArithmetic.product(0.4, shape.radius, shape.radius),
          z: ArchetypeMassArithmetic.product(0.4, shape.radius, shape.radius),
        },
      };
    case "cylinder": {
      const across: number = ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(0.25, shape.radius, shape.radius),
        ArchetypeMassArithmetic.product(1 / 12, shape.height, shape.height),
      ]);
      return {
        volume: ArchetypeMassArithmetic.product(
          Math.PI,
          shape.radius,
          shape.radius,
          shape.height,
        ),
        centroid: zero,
        unit: {
          x: across,
          y: ArchetypeMassArithmetic.product(0.5, shape.radius, shape.radius),
          z: across,
        },
      };
    }
    case "cone": {
      // Apex at -h/2 and base at +h/2: the centroid lies a quarter of the height from the base.
      const across: number = ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(3 / 20, shape.radius, shape.radius),
        ArchetypeMassArithmetic.product(3 / 80, shape.height, shape.height),
      ]);
      return {
        volume: ArchetypeMassArithmetic.product(
          Math.PI / 3,
          shape.radius,
          shape.radius,
          shape.height,
        ),
        centroid: { x: 0, y: shape.height / 4, z: 0 },
        unit: {
          x: across,
          y: ArchetypeMassArithmetic.product(0.3, shape.radius, shape.radius),
          z: across,
        },
      };
    }
    case "capsule": {
      // A cylinder of length h and two hemispheres, each with its centroid 3r/8 beyond the cylinder's end and a transverse central moment of 83/320 m r^2.
      const r: number = shape.radius;
      const h: number = shape.height;
      const cylinder: number = ArchetypeMassArithmetic.product(
        Math.PI,
        r,
        r,
        h,
      );
      const hemisphere: number = ArchetypeMassArithmetic.product(
        (2 / 3) * Math.PI,
        r,
        r,
        r,
      );
      const volume: number = cylinder + 2 * hemisphere;
      const cylinderShare: number = cylinder / volume;
      const hemisphereShare: number = (2 * hemisphere) / volume;
      const shift: number = h / 2 + (3 * r) / 8;
      const across: number = ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(cylinderShare, 0.25, r, r),
        ArchetypeMassArithmetic.product(cylinderShare, 1 / 12, h, h),
        ArchetypeMassArithmetic.product(hemisphereShare, 83 / 320, r, r),
        ArchetypeMassArithmetic.product(hemisphereShare, shift, shift),
      ]);
      const along: number = ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(cylinderShare, 0.5, r, r),
        ArchetypeMassArithmetic.product(hemisphereShare, 0.4, r, r),
      ]);
      return {
        volume,
        centroid: zero,
        unit: { x: across, y: along, z: across },
      };
    }
    case "plane":
      return null;
  }
}

/** Preserve the ordinary box rule; rescue only its overflowing square sum. */
function transverse(a: number, b: number): number {
  const ordinary: number = (a * a + b * b) / 12;
  return Number.isFinite(ordinary)
    ? ordinary
    : ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(1 / 12, a, a),
        ArchetypeMassArithmetic.product(1 / 12, b, b),
      ]);
}
