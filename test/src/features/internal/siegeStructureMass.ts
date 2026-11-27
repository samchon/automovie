import type { AutoMovieArchetypeSiegeEngine } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";

/** The actual public launcher with its complete real coarse solids. */
type Engine = ReturnType<typeof AutoMovieArchetypeSiegeEngine.create>;

/**
 * An independently measured uniform actual solid and its central principal
 * moments per kilogram.
 */
interface ISolid {
  /** Actual source volume in cubic metres. */
  volume: number;
  /** Actual primitive centre in model metres. */
  centre: IAutoMovieVector3;
  /** Actual local principal axes expressed in the model frame. */
  axes: readonly IAutoMovieVector3[];
  /** Textbook central principal moments per kilogram, square metres. */
  diagonal: readonly number[];
}

/**
 * Independently observe the complete real siege composite under its stated
 * mass.
 *
 * @param engine Actual source engine at rest, including every fitting and cord.
 * @param label Complete kind/seed identity.
 * @param findings Whole-round failure collector.
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual primitive volumes and model-frame centroid/inertia under the existing uniform relative-density premise and fixed total kilograms. This coarse composite is independent of the reduced launcher armMass/counterweight controls; no measured component calibration is asserted.
 * @evidence contracts/development/implementation.md#principled-implementation Read every actual box/cylinder's dimensions and rigid transform. Textbook volume and central principal moments, rotated into model axes and combined by the parallel-axis theorem, give an independent centre and all six tensor components. Every visible real solid contributes positive volume.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure actual solids, sum their volumes/centres, then reduce their central and offset tensor contributions under the stated total mass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Calls no production mass, fitting, clearance or pendulum helper and excludes no new shaft/pin/winch/rope. No zero-share fitting, proxy, assumed measured density or historical component weight supplies an expected result.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two O(P) passes over actual primitives with fixed-size tensor arithmetic, independent of film duration.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One measured record per actual solid serves both volume centroid and all tensor components; existing quaternion arithmetic and independent nclose own their narrow operations.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All measured records and scalars are call-local; only caller-owned failures escape.
 */
export function siegeStructureMass(
  engine: Engine,
  label: string,
  findings: string[],
): void {
  const solids: ISolid[] = engine.parts.map(
    (part: IAutoMovieModelPart): ISolid => {
      if (
        part.geometry.type !== "primitive" ||
        part.transform === null ||
        part.transform === undefined
      )
        throw new Error(
          "Every actual siege solid must retain its primitive and frame",
        );
      const shape: typeof part.geometry.shape = part.geometry.shape;
      let volume: number;
      let diagonal: readonly number[];
      if (shape.type === "box") {
        volume = shape.width * shape.height * shape.depth;
        diagonal = [
          (shape.height ** 2 + shape.depth ** 2) / 12,
          (shape.width ** 2 + shape.depth ** 2) / 12,
          (shape.width ** 2 + shape.height ** 2) / 12,
        ];
      } else if (shape.type === "cylinder") {
        volume = Math.PI * shape.radius ** 2 * shape.height;
        diagonal = [
          (3 * shape.radius ** 2 + shape.height ** 2) / 12,
          shape.radius ** 2 / 2,
          (3 * shape.radius ** 2 + shape.height ** 2) / 12,
        ];
      } else throw new Error(`Unsupported actual siege solid ${part.id}`);
      if (!(volume > 0))
        throw new Error(`Invalid actual siege volume ${part.id}`);
      return {
        volume,
        centre: part.transform.translation,
        axes: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
        ].map(
          (axis: IAutoMovieVector3): IAutoMovieVector3 =>
            AutoMovieEngineQuaternion.rotateVector(part.transform!.rotation, axis),
        ),
        diagonal,
      };
    },
  );
  const total: number = solids.reduce(
    (sum: number, solid: ISolid): number => sum + solid.volume,
    0,
  );
  const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const solid of solids)
    for (const axis of ["x", "y", "z"] as const)
      centre[axis] += (solid.volume / total) * solid.centre[axis];
  for (const axis of ["x", "y", "z"] as const)
    near(
      `${label} actual composite centre.${axis}`,
      engine.properties.centerOfMass[axis],
      centre[axis],
    );
  const tensor: Engine["properties"]["inertia"] = {
    xx: 0,
    yy: 0,
    zz: 0,
    xy: 0,
    xz: 0,
    yz: 0,
  };
  for (const solid of solids) {
    const mass: number = (engine.dimensions.mass! * solid.volume) / total;
    const x: number = solid.centre.x - centre.x;
    const y: number = solid.centre.y - centre.y;
    const z: number = solid.centre.z - centre.z;
    tensor.xx += mass * (y * y + z * z);
    tensor.yy += mass * (x * x + z * z);
    tensor.zz += mass * (x * x + y * y);
    tensor.xy -= mass * x * y;
    tensor.xz -= mass * x * z;
    tensor.yz -= mass * y * z;
    for (let index: number = 0; index < 3; index++) {
      const axis: IAutoMovieVector3 = solid.axes[index]!;
      const principal: number = mass * solid.diagonal[index]!;
      tensor.xx += principal * axis.x ** 2;
      tensor.yy += principal * axis.y ** 2;
      tensor.zz += principal * axis.z ** 2;
      tensor.xy += principal * axis.x * axis.y;
      tensor.xz += principal * axis.x * axis.z;
      tensor.yz += principal * axis.y * axis.z;
    }
  }
  for (const component of ["xx", "yy", "zz", "xy", "xz", "yz"] as const)
    near(
      `${label} actual composite inertia ${component}`,
      engine.properties.inertia[component],
      tensor[component],
    );

  /**
   * Every independent component retains the existing absolute comparison
   * budget.
   */
  function near(name: string, actual: number, expected: number): void {
    try {
      TestValidator.predicate(
        `${name}: ${actual} expected ${expected}`,
        nclose(actual, expected, 1e-9),
      );
    } catch (error) {
      findings.push(String(error));
    }
  }
}
