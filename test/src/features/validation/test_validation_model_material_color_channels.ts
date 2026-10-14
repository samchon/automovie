import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieConstraintViolation,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";

/**
 * Material color channels and their optional display swatches agree.
 *
 * Scenarios:
 * 1. Unit red/green labels and null alpha validate without changing their RGB.
 * 2. Non-finite alpha, negative/non-finite emissive RGB and excess alpha fail
 *    independently, alongside malformed six-digit swatches.
 * 3. A well-formed contradictory swatch is refused; null labels and uppercase
 *    spellings of the matching sRGB swatch remain accepted.
 * 4. Linear mid-grey maps to quantized sRGB BC, rather than unconverted 80.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel on authored base and emissive colors and requires located scalar, label-shape and label-consistency refusals; detects a validator accepting contradictory hex even while all linear components lie in range.
 * @evidence contracts/testing.md#independent-expectations Unit red and green are exact endpoints of the sRGB transfer; linear 0.5 encodes to round(255*(1.055*0.5^(1/2.4)-0.055))=188, hexadecimal BC. These expected labels are specified independently of the product conversion helper.
 * @evidence contracts/testing.md#distinguishing-cases Covers nullable alpha and labels, invalid RGB/alpha values, malformed labels, valid-but-wrong labels, case-insensitive matching labels and a nonlinear midtone; stage tests own the same color rule through light/fog/background ingress.
 * @evidence contracts/testing.md#execution-ownership The synchronous unit entry directly imports the engine model validator and owns every case using the shared model fixture; no process, native artifact or renderer is involved.
 */
export function test_validation_model_material_color_channels(): void {
  const base: IAutoMovieModel = createModel();
  function check(
    baseColor: IAutoMovieColor,
    emissive: IAutoMovieColor | null = null,
  ): IAutoMovieValidation {
    return validateModel({
      model: {
        ...base,
        materials: base.materials.map(
          (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
            ...material,
            baseColor,
            emissive,
          }),
        ),
      },
    });
  }
  const red: IAutoMovieColor = { r: 1, g: 0, b: 0, a: null, hex: "#FF0000" };
  const green: IAutoMovieColor = { r: 0, g: 1, b: 0, a: null, hex: "#00FF00" };
  TestValidator.equals(
    "exact endpoint swatches validate",
    check(red, green).success,
    true,
  );
  const invalid: IAutoMovieValidation = check(
    { ...red, a: Number.NaN, hex: "#fff" },
    { r: -0.1, g: Infinity, b: 0.3, a: 1.5, hex: "#GG0000" },
  );
  for (const path of ["baseColor.a", "emissive.r", "emissive.g", "emissive.a"])
    assertFault(
      invalid,
      `.materials[0].${path}`,
      "range",
      "finite number within [0, 1]",
    );
  for (const path of ["baseColor.hex", "emissive.hex"])
    assertFault(invalid, `.materials[0].${path}`, "type", "#RRGGBB");
  assertFault(
    check({ ...red, hex: "#00FF00" }),
    ".materials[0].baseColor.hex",
    "type",
    "hex must match the linear RGB channels encoded as #ff0000",
  );
  TestValidator.equals(
    "an omitted display label needs no agreement check",
    check({ ...red, hex: null }).success,
    true,
  );
  const grey: IAutoMovieColor = {
    r: 0.5,
    g: 0.5,
    b: 0.5,
    a: 1,
    hex: "#BCBCBC",
  };
  TestValidator.equals(
    "uppercase quantized midtone label validates",
    check(grey).success,
    true,
  );
  assertFault(
    check({ ...grey, hex: "#808080" }),
    ".materials[0].baseColor.hex",
    "type",
    "encoded as #bcbcbc",
  );
}

/** Require the color-field path, violation category and actionable reason. */
function assertFault(
  result: IAutoMovieValidation,
  suffix: string,
  kind: "type" | "range",
  reason: string,
): void {
  TestValidator.predicate(
    `${suffix}: ${reason}`,
    result.success === false &&
      result.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.kind === kind &&
          item.path === "$input" + suffix &&
          item.expected.includes(reason),
      ),
  );
}
