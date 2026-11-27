import type {
  IAutoMoviePrimitiveShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";

/*
 * A primitive's volume, centre and central moments per unit mass in its own
 * axes. Local volume must be finite and positive, and local principal moments
 * finite and positive; geometries outside that local representable domain are
 * refused.
 * Parameter shape: The primitive.
 * Returns: Its volume, centroid and central inertia per unit mass.
 * For invalid dimensions or unrepresentable local properties.
 */
export function ArchetypeMassPrimitive(
  shape: IAutoMoviePrimitiveShape,
): ILocal | null {
  for (const [name, value] of Object.entries(shape))
    if (name !== "type" && !(value > 0))
      throw new Error(
        `Mass primitive ${shape.type} needs finite positive ${name}`,
      );
  const result: ILocal | null = evaluate(shape);
  if (
    result !== null &&
    !(
      result.volume > 0 &&
      result.unit.x > 0 &&
      result.unit.y > 0 &&
      result.unit.z > 0
    )
  )
    throw new Error(
      `Mass primitive ${shape.type} needs representable finite volume and principal moments`,
    );
  return result;
}

/*
 * A primitive in its own axes: volume, centroid and central principal inertia
 * per unit mass.
 */
interface ILocal {
  /*
   * Volume, cubic metres.
   */
  volume: number;

  /*
   * Centroid in the primitive's coordinates, metres.
   */
  centroid: IAutoMovieVector3;

  /*
   * Central moments about the primitive's axes per unit mass, square metres.
   */
  unit: IAutoMovieVector3;
}

/*
 * Uniform-solid formulas in the primitive's axes.
 */
function evaluate(shape: IAutoMoviePrimitiveShape): ILocal | null {
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

/*
 * Preserve the ordinary box rule; rescue only its overflowing square sum.
 */
function transverse(a: number, b: number): number {
  const ordinary: number = (a * a + b * b) / 12;
  return ordinary !== Infinity
    ? ordinary
    : ArchetypeMassArithmetic.sum([
        ArchetypeMassArithmetic.product(1 / 12, a, a),
        ArchetypeMassArithmetic.product(1 / 12, b, b),
      ]);
}
