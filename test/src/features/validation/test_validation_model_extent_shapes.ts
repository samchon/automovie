import { validateModel } from "@automovie/engine";
import {
  AutoMoviePrimitiveShape,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

const part: (id: string, shape: AutoMoviePrimitiveShape) => IAutoMovieModelPart = (
  id: string,
  shape: AutoMoviePrimitiveShape,
): IAutoMovieModelPart => ({
  id,
  name: id,
  geometry: { type: "primitive", shape },
  material: null,
  attachedBone: null,
  transform: null,
});

/**
 * Exercise the five non-box primitive dimension branches with collapsed authored dimensions.
 *
 * Scenarios:
 * 1. A zero-radius sphere, zero-width plane, zero-height cylinder, zero-radius cone and zero-height capsule each report their own dimension fault.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual model validation on all five existing bad parts and requires each exact dimension path in addition to the original grouped suffix checks, catching a missing shape branch masked by another part with the same field name.
 * @evidence contracts/testing.md#independent-expectations Every supplied zero violates the shape's strictly-positive dimension policy; the literal part indices and dimension names independently identify each expected range finding without tessellating expected geometry.
 * @evidence contracts/testing.md#distinguishing-cases Retains sphere/plane/cylinder/cone/capsule refusals together and resolves their formerly ambiguous grouped findings; box, positive model and nonfinite scalar cases have separate entries. No new shape or numerical case is added.
 * @evidence contracts/testing.md#execution-ownership The named portable unit owns the existing five primitive records through its local part helper and calls engine admission without a geometry builder, renderer or native artifact.
 */
export function test_validation_model_extent_shapes(): void {
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
  for (const [index, dimension] of [[0, "radius"], [1, "width"], [2, "height"], [3, "radius"], [4, "height"]] as const)
    TestValidator.predicate(`part ${index} ${dimension} flagged`, hasViolation(result, "range", `$input.parts[${index}].geometry.shape.${dimension}`));
}
