import { TestValidator } from "@nestia/e2e";

import { createDentalCrownAxis } from "../../../scripts/face-review/createDentalCrownAxis";
import { evaluateDentalSurfaceAnchor } from "../../../scripts/face-review/evaluateDentalSurfaceAnchor";
import type { IDentalClinicalRegistration } from "../../../scripts/face-review/IDentalClinicalRegistration";
import { measureDentalClinicalHeight } from "../../../scripts/face-review/measureDentalClinicalHeight";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Registration makes measurement reproducible without certifying anatomy.
 * The analytic points are incisal (0,0,0), cervical (0,20,0) mm and gingival
 * zenith (0,10,0) mm. The axis stays with the crown as gingiva moves along Y.
 * Inputs and their registration retain their values on every refusal.
 *
 * Scenarios:
 * 1. Registered anchors give 10 mm height and one metre per metre Y response;
 *    a half-moving anchor gives half response, and no moving vertex gives zero.
 * 2. Missing, stale or unnamed registration refuses, as does moving an axis
 *    or incisal landmark together with the gingiva.
 * 3. Empty, mismatched, negative/nonfinite or unnormalized weights and
 *    nonresident/fractional indices refuse; finite zero-weight anchors accept.
 * 4. Nonfinite source points and coincident/nonfinite axis references refuse.
 */
export const test_subject_dental_clinical_registration = (): void => {
  const positions = [0, 0, 0, 0, 0.02, 0, 0, 0.01, 0];
  const point = (vertex: number) => ({ vertices: [vertex], weights: [1] });
  const registered: IDentalClinicalRegistration = {
    basisRevision: "analytic-registration",
    registrationId: "independent-points",
    axis: { incisal: point(0), cervical: point(1) },
    incisalOrCusp: point(0),
    gingivalZenith: point(2),
  };
  const measure = (registration: IDentalClinicalRegistration | undefined, moving = new Set([2])) =>
    measureDentalClinicalHeight(positions, registered.basisRevision, registration, moving);
  const measured = measure(registered);
  TestValidator.predicate("registered height and cervical movement response",
    nclose(measured.heightMetres, 0.01, 1e-12) && measured.metresPerUpShift === 1);
  TestValidator.predicate("stationary gingiva has zero Y response", nclose(measure(registered, new Set()).metresPerUpShift, 0, 1e-12));
  const partial = { ...registered, gingivalZenith: { vertices: [2, 0], weights: [0.5, 0.5] } };
  TestValidator.predicate("partial carried landmark has half Y response", nclose(measure(partial).metresPerUpShift, 0.5, 1e-12));
  for (const registration of [undefined, { ...registered, basisRevision: "stale" }, { ...registered, registrationId: " " }])
    TestValidator.predicate("registration identity refuses", throwsError(() => measure(registration), ["landmark registration"]));
  TestValidator.predicate("moving crown axis refuses", throwsError(() => measure(registered, new Set([0, 2])), ["stationary crown axis"]));
  TestValidator.predicate("moving cervical axis endpoint refuses", throwsError(() => measure(registered, new Set([1])), ["stationary crown axis"]));
  TestValidator.predicate("a separately registered moving incisal landmark refuses",
    throwsError(() => measure({ ...registered, incisalOrCusp: point(2) }), ["stationary crown axis"]));
  const before = JSON.stringify({ positions, registered });
  for (const anchor of [
    { vertices: [], weights: [] }, { vertices: [0], weights: [] },
    { vertices: [0], weights: [-1] }, { vertices: [0], weights: [NaN] },
    { vertices: [0], weights: [0.5] }, { vertices: [0.5], weights: [1] },
    { vertices: [-1], weights: [1] }, { vertices: [3], weights: [1] },
  ])
    TestValidator.predicate("invalid surface registration refuses",
      throwsError(() => evaluateDentalSurfaceAnchor(positions, anchor), ["resident vertices"]));
  const weighted = evaluateDentalSurfaceAnchor(positions, { vertices: [0, 2], weights: [0, 1] });
  TestValidator.predicate("zero-weight resident contributes no displacement",
    weighted.every((value, axis) => nclose(value, [0, 0.01, 0][axis], 1e-12)));
  TestValidator.predicate("nonfinite source refuses",
    throwsError(() => evaluateDentalSurfaceAnchor([0, Infinity, 0], point(0)), ["finite source"]));
  for (const cervical of [[0, 0, 0], [0, Infinity, 0]])
    TestValidator.predicate("degenerate axis refuses",
      throwsError(() => createDentalCrownAxis([0, 0, 0], cervical), ["distinct finite"]));
  TestValidator.equals("refusal retains all input values", JSON.stringify({ positions, registered }), before);
};
