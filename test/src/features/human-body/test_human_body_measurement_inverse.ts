import { invertHumanBodyMeasurement } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The measured detailed channel is solved as a bounded inverse, with a
 * 0.1 mm readout interval rather than a vertex-displacement slider.
 *
 * Scenarios:
 * 1. Increasing and decreasing analytic instruments recover a weight and
 *    actual metric reading; an already displayed value preserves its weight.
 * 2. The exact range boundary is reachable; values beyond it and a flat
 *    response refuse without clamping.
 * 3. A reversing midpoint, a discontinuous target and nonfinite input or
 *    reading refuse rather than claiming a shaped body was measured.
 * 4. An affine metric response needs at most five actual readings: the
 *    current point, the two ends, a midpoint check and its exact inverse.
 */
export const test_human_body_measurement_inverse = (): void => {
  const solve = (
    read: (weight: number) => number,
    targetMetres: number,
    current = 0,
    range: [number, number] = [-1, 1],
  ) =>
    invertHumanBodyMeasurement({
      range,
      current,
      targetMetres,
      read,
      label: "test girth",
    });
  const increasing = solve((weight) => 1.5 + 0.5 * weight, 1.75);
  TestValidator.predicate(
    "increasing metric inverse",
    nclose(increasing.weight, 0.5, 0.0001) &&
      nclose(increasing.actualMetres, 1.75, 0.00005),
  );
  let reads = 0;
  const affine = solve((weight) => {
    reads++;
    return 1.5 + 0.5 * weight;
  }, 1.65);
  TestValidator.predicate(
    "affine response uses its measured line without repeated bisection",
    reads <= 5 &&
      nclose(affine.weight, 0.3, 0.0001) &&
      nclose(affine.actualMetres, 1.65, 0.00005),
  );
  const decreasing = solve((weight) => 1.5 - 0.5 * weight, 1.25);
  TestValidator.predicate(
    "decreasing metric inverse",
    nclose(decreasing.weight, 0.5, 0.0001) &&
      nclose(decreasing.actualMetres, 1.25, 0.00005),
  );
  const unchanged = solve((weight) => 1.5 + weight, 1.70002, 0.2);
  TestValidator.predicate(
    "display-equivalent target keeps exact input",
    unchanged.weight === 0.2 && nclose(unchanged.actualMetres, 1.7),
  );
  const boundary = solve((weight) => 1.5 + weight, 2.5);
  TestValidator.predicate(
    "upper boundary measured",
    nclose(boundary.weight, 1, 0.0001) &&
      nclose(boundary.actualMetres, 2.5, 0.00005),
  );
  TestValidator.predicate(
    "outside reach refuses",
    throwsError(() => solve((weight) => 1.5 + weight, 2.6), "reaches"),
  );
  TestValidator.predicate(
    "flat response refuses",
    throwsError(() => solve(() => 1.5, 1.6), "reaches"),
  );
  TestValidator.predicate(
    "reversing response refuses",
    throwsError(
      () => solve((weight) => weight + 2 * Math.sin(Math.PI * weight), 0.75, 0, [0, 1]),
      "reverses",
    ),
  );
  TestValidator.predicate(
    "discontinuous target refuses",
    throwsError(
      () => solve((weight) => (weight < 0.5 ? 0 : 1), 0.5, 0, [0, 1]),
      "within 0.1 mm",
    ),
  );
  TestValidator.predicate(
    "nonfinite target and reading refuse",
    throwsError(() => solve((weight) => weight, NaN), "finite") &&
      throwsError(() => solve(() => NaN, 1.5), "cannot measure"),
  );
  TestValidator.predicate(
    "invalid envelope and current weight refuse",
    throwsError(() => solve((weight) => weight, 0.5, 0, [1, -1]), "ordered range") &&
      throwsError(() => solve((weight) => weight, 0.5, 2), "current weight"),
  );
};
