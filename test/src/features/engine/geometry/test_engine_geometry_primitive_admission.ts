import {
  AutoMovieEngineGeometry,
  AutoMovieEngineValidation,
} from "@automovie/engine";
import type { IAutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../internal/fixtures";
import { hasViolation } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * A model and standalone realization apply the same primitive dimension rule.
 *
 * Scenarios:
 *
 * 1. Four invalid sphere radii fail model validation at the radius path and are
 *    refused by direct tessellation, mesh conversion and realization.
 * 2. A valid half-metre sphere retains the fixed 16-by-12 latitude lattice. The
 *    model admits it and both meshes match the latitude recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both admission routes, the invalid radii and the independently known sphere lattice.
 * @evidence contracts/development/testing.md#behavioral-verification Calls model validation and each public geometry producer with the same sphere, then observes the violation path or actual mesh arrays.
 * @evidence contracts/development/testing.md#independent-expectations The failure matrix is the finite, strictly positive metre contract. The expected lattice counts and first vertices follow from the fixed angular and latitude counts and the north-pole equation.
 */
export function test_engine_geometry_primitive_admission(): void {
  const model = createModel();
  const validate = (shape: IAutoMoviePrimitiveShape) =>
    AutoMovieEngineValidation.validateModel({
      model: {
        ...model,
        parts: [{ ...model.parts[0]!, geometry: { type: "primitive", shape } }],
      },
    });
  const misses: string[] = [];
  for (const radius of [0, Number.NaN, Infinity, -Infinity]) {
    const shape: IAutoMoviePrimitiveShape = { type: "sphere", radius };
    if (
      !hasViolation(
        validate(shape),
        "range",
        "$input.parts[0].geometry.shape.radius",
      )
    )
      misses.push(`model validation admitted ${radius}`);
    const producers: ReadonlyArray<readonly [string, () => unknown]> = [
      ["tessellate", () => AutoMovieEngineGeometry.tessellate(shape)],
      [
        "tessellateToMesh",
        () => AutoMovieEngineGeometry.tessellateToMesh(shape),
      ],
      [
        "realizeGeometry",
        () =>
          AutoMovieEngineGeometry.realizeGeometry({ type: "primitive", shape }),
      ],
    ];
    for (const [name, produce] of producers)
      if (!throwsError(produce, "radius must be a finite number > 0"))
        misses.push(`${name} admitted ${radius}`);
  }

  const shape: IAutoMoviePrimitiveShape = { type: "sphere", radius: 0.5 };
  TestValidator.predicate("valid sphere model", validate(shape).success);
  for (const mesh of [
    AutoMovieEngineGeometry.tessellate(shape),
    AutoMovieEngineGeometry.tessellateToMesh(shape),
    AutoMovieEngineGeometry.realizeGeometry({ type: "primitive", shape }).mesh,
  ]) {
    TestValidator.equals(
      "sphere position count",
      mesh.positions.length,
      17 * 13 * 3,
    );
    TestValidator.equals(
      "sphere index count",
      mesh.indices?.length,
      16 * 12 * 6,
    );
    TestValidator.predicate(
      "finite sphere vertices start at the north pole",
      mesh.positions.every(Number.isFinite) &&
        mesh.positions[0] === 0 &&
        mesh.positions[1] === 0.5 &&
        mesh.positions[2] === 0,
    );
  }
  TestValidator.equals("invalid primitive refusals", misses, []);
}
