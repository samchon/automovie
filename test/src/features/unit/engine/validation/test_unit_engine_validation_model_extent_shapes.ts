import { validateModel } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieModelPart,
  type IAutoMoviePrimitiveShape,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const part: (
  id: string,
  shape: IAutoMoviePrimitiveShape,
) => IAutoMovieModelPart = (
  id: string,
  shape: IAutoMoviePrimitiveShape,
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: { type: "primitive", shape },
  material: null,
  attachedBone: null,
  transform: null,
});

/**
 * Exercise the five non-box primitive dimension branches with collapsed
 * authored dimensions.
 *
 * Scenarios:
 *
 * 1. A zero-radius sphere, zero-width plane, zero-height cylinder, zero-radius
 *    cone and zero-height capsule each report their own dimension fault.
 */
export function test_unit_engine_validation_model_extent_shapes(): void {
  const model: IAutoMovieModel = {
    ...createModel(),
    materials: [],
    parts: [
      part("sphere", { type: "sphere", radius: 0 }),
      part("plane", { type: "plane", width: 0, depth: 1 }),
      part("cylinder", { type: "cylinder", radius: 0.2, height: 0 }),
      part("cone", { type: "cone", radius: 0, height: 1 }),
      part("capsule", { type: "capsule", radius: 0.2, height: 0 }),
    ],
  };
  const result: IAutoMovieValidation = validateModel({ model });
  TestValidator.equals("bad extents fail", result.success, false);
  TestValidator.predicate(
    "sphere/cone radius flagged",
    hasViolation(result, "range", ".radius"),
  );
  TestValidator.predicate(
    "plane width flagged",
    hasViolation(result, "range", ".width"),
  );
  TestValidator.predicate(
    "cylinder/capsule height flagged",
    hasViolation(result, "range", ".height"),
  );
  for (const [index, dimension] of [
    [0, "radius"],
    [1, "width"],
    [2, "height"],
    [3, "radius"],
    [4, "height"],
  ] as const)
    TestValidator.predicate(
      `part ${index} ${dimension} flagged`,
      hasViolation(
        result,
        "range",
        `$input.parts[${index}].geometry.shape.${dimension}`,
      ),
    );
}
