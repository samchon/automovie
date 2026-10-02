import { TestValidator } from "@nestia/e2e";

import { createDentalCrownAxis } from "../../../scripts/face-review/createDentalCrownAxis";
import { evaluateDentalSurfaceAnchor } from "../../../scripts/face-review/evaluateDentalSurfaceAnchor";
import { measureDentalClinicalHeight } from "../../../scripts/face-review/measureDentalClinicalHeight";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A diagonal reference vector has unit direction (+/-1,+/-1,0)/sqrt(2)
 * independently of its scale. Subnormal length rounding must not produce
 * (1,1,0). Registered height and Y response use that same directed unit axis.
 * No physiological range or changed acceptance epsilon participates.
 *
 * Scenarios:
 * 1. Ordinary, minimum-subnormal and large finite diagonals, in both signs,
 *    retain the independent sqrt(2) direction, norm, height and Y response.
 * 2. Zero landmark separation gives zero signed height. Unrepresentable axis
 *    differences, norms and height arithmetic refuse rather than return NaN
 *    or Infinity; ordinary finite neighbours remain measurable.
 */
export const test_subject_dental_crown_axis_numeric = (): void => {
  for (const scale of [1, Number.MIN_VALUE, 1e308])
    for (const sign of [1, -1]) {
      const axis = createDentalCrownAxis([0, 0, 0], [sign * scale, sign * scale, 0]);
      TestValidator.predicate("diagonal unit follows the independent sqrt-two oracle",
        nclose(axis.unit[0], sign * Math.SQRT1_2, 1e-15) &&
        nclose(axis.unit[1], sign * Math.SQRT1_2, 1e-15) && nclose(axis.unit[2], 0, 0) &&
        nclose(Math.hypot(...axis.unit), 1, 1e-15));
      const heightScale = scale === Number.MIN_VALUE ? scale : scale / 2;
      const positions = [0, 0, 0, sign * scale, sign * scale, 0,
        sign * heightScale, sign * heightScale, 0];
      const point = (vertex: number) => ({ vertices: [vertex], weights: [1] });
      const registration = {
        basisRevision: "numeric-diagonal", registrationId: "independent-diagonal",
        axis: { incisal: point(0), cervical: point(1) },
        incisalOrCusp: point(0), gingivalZenith: point(2),
      };
      const measured = measureDentalClinicalHeight(positions, registration.basisRevision, registration, new Set([2]));
      const expectedHeight = heightScale * Math.SQRT2;
      const tolerance = scale === Number.MIN_VALUE ? 0 : expectedHeight * 1e-15;
      TestValidator.predicate("registered height and movement response share the valid axis",
        nclose(measured.heightMetres, expectedHeight, tolerance) &&
        nclose(measured.metresPerUpShift, sign * Math.SQRT1_2, 1e-15));
    }
  for (const [incisal, cervical] of [
    [[0, 0, 0], [Number.MAX_VALUE, Number.MAX_VALUE, 0]],
    [[-Number.MAX_VALUE, 0, 0], [Number.MAX_VALUE, 0, 0]],
  ])
    TestValidator.predicate("unrepresentable axis refuses",
      throwsError(() => createDentalCrownAxis(incisal, cervical), ["representable length"]));
  const point = (vertex: number) => ({ vertices: [vertex], weights: [1] });
  const registration = {
    basisRevision: "numeric-height", registrationId: "independent-height",
    axis: { incisal: point(0), cervical: point(1) },
    incisalOrCusp: point(0), gingivalZenith: point(2),
  };
  const measure = (positions: number[]) => measureDentalClinicalHeight(
    positions, registration.basisRevision, registration, new Set([2]));
  TestValidator.predicate("coincident clinical landmarks retain zero height",
    nclose(measure([0, 0, 0, 1, 1, 0, 0, 0, 0]).heightMetres, 0, 0));
  for (const positions of [
    [-Number.MAX_VALUE, 0, 0, 0, 0, 0, Number.MAX_VALUE, 0, 0],
    [0, 0, 0, 1, 1, 0, Number.MAX_VALUE, Number.MAX_VALUE, 0],
  ])
    TestValidator.predicate("unrepresentable clinical arithmetic refuses",
      throwsError(() => measure(positions), ["arithmetic must remain finite"]));
  const minimum = Number.MIN_VALUE;
  const constant = evaluateDentalSurfaceAnchor([minimum, minimum, 0, minimum, minimum, 0],
    { vertices: [0, 1], weights: [0.5, 0.5] });
  TestValidator.predicate("fractional registration preserves a constant subnormal field",
    nclose(constant[0], minimum, 0) && nclose(constant[1], minimum, 0));
  TestValidator.predicate("unrepresentable anchor difference refuses",
    throwsError(() => evaluateDentalSurfaceAnchor([-Number.MAX_VALUE, 0, 0, Number.MAX_VALUE, 0, 0],
      { vertices: [0, 1], weights: [0.5, 0.5] }), ["representable interpolation differences"]));
  const weights = [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.4];
  const extreme = weights.flatMap((_weight, at) => [at === 0 ? 0 : Number.MAX_VALUE, 0, 0]);
  TestValidator.predicate("unrepresentable weighted arithmetic refuses",
    throwsError(() => evaluateDentalSurfaceAnchor(extreme,
      { vertices: weights.map((_weight, at) => at), weights }), ["interpolation arithmetic must remain finite"]));
};
