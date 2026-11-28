import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieMaterialWear,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { boxModel } from "../internal/boxModel";
import { hasViolation } from "../internal/hasViolation";

/**
 * Model admission accepts a wear record with either layer and refuses an empty
 * record and each out-of-range layer field at its own path.
 *
 * Scenarios:
 *
 * 1. Wear with an edge layer, with a grime layer and with both is admitted,
 *    including `amount: 1`.
 * 2. Wear with neither layer is refused at `wear`.
 * 3. `amount: 1.5`, `amount: 0`, `width: 0` and `roughness: 1.2` are refused at
 *    their fields, and a seed of 2³² is refused at `wear.seed`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `validateModel` on boxes citing worn materials; a field let through or reported elsewhere fails. The amount cases admit one and refuse zero and 1.5. Each other refusal isolates its changed field.
 * @evidence contracts/development/testing.md#independent-expectations Every refusal is a range the issue and the contract state: amount in (0, 1], positive width, roughness in [0, 1], at least one layer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_material_wear_admission(): void {
  const check: (wear: unknown) => IAutoMovieValidation = (
    wear: unknown,
  ): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateModel({
      model: boxModel({
        id: "chair",
        materials: [{ ...material(), wear: wear as IAutoMovieMaterialWear }],
      }),
    });

  // 1. Admitted.
  TestValidator.predicate(
    "an edge layer",
    check({ seed: 1, edge: layer() }).success,
  );
  TestValidator.predicate(
    "a grime layer",
    check({ seed: 1, grime: layer() }).success,
  );
  TestValidator.predicate(
    "both layers with amount one",
    check({ seed: 1, edge: layer(), grime: { ...layer(), amount: 1 } }).success,
  );

  // 2. No layer.
  TestValidator.predicate(
    "wear without a layer is refused",
    hasViolation(check({ seed: 1 }), "type", ".wear"),
  );

  // 3. Ranges.
  for (const [field, value] of [
    ["amount", 1.5],
    ["amount", 0],
    ["width", 0],
    ["roughness", 1.2],
  ] as const)
    TestValidator.predicate(
      `${field} ${value} is refused`,
      hasViolation(
        check({ seed: 1, edge: { ...layer(), [field]: value } }),
        "range",
        `.wear.edge.${field}`,
      ),
    );
  TestValidator.predicate(
    "a seed of 2^32 is refused",
    hasViolation(
      check({ seed: 4294967296, edge: layer() }),
      "range",
      ".wear.seed",
    ),
  );
}

/** An admissible layer. */
function layer(): IAutoMovieMaterialWear.ILayer {
  return { color: color(0.3), roughness: 0.7, width: 0.01, amount: 0.6 };
}

/** A plain material. */
function material(): IAutoMovieMaterial {
  return {
    id: "paint",
    name: null,
    baseColor: color(0.5),
    metallic: 0,
    roughness: 0.4,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
  };
}

/** A grey linear colour. */
function color(value: number): IAutoMovieColor {
  return { r: value, g: value, b: value, a: 1, hex: null };
}
