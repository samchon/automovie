import { TestValidator } from "@nestia/e2e";

import { faceClinicalCrowns } from "../../../scripts/face-review/prepareGingivaBasis";
import { measureDentalClinicalHeight } from "../../../scripts/face-review/measureDentalClinicalHeight";
import { nclose } from "../internal/predicates";

/**
 * Clinical crown height follows the tooth's longitudinal axis, rather than
 * the camera's vertical. Melo et al. 2019 measure gingival zenith to incisal
 * margin along that axis; a rigid rotation changes neither anatomical point
 * nor their axial separation. A frontal raster remains a visibility proxy.
 * These two planar components provide an independent ten-millimetre crown
 * and overlying gingiva in metres, without a human asset or photograph.
 *
 * Scenarios:
 * 1. An upright crown has an exposed ten-millimetre interval. Confirm this
 *    arrangement through the existing raster before testing its interpretation.
 * 2. Rotate crown and gingiva together thirty degrees about X. Their clinical
 *    axial distance remains ten millimetres, while frontal Y display changes.
 *    The quantity compared with the clinical norm must retain the axial value.
 */
export const test_subject_dental_clinical_height_rotation = (): void => {
  const resolution = 0.0001;
  const original = [
    -0.01, 0, 0, 0.01, 0, 0, 0.01, 0.02, 0, -0.01, 0.02, 0,
    -0.011, 0.01, 0.0001, 0.011, 0.01, 0.0001,
    0.011, 0.025, 0.0001, -0.011, 0.025, 0.0001,
  ];
  const measure = (positions: number[]) => faceClinicalCrowns({
    positions,
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
    component: Int32Array.from([0, 0, 0, 0, 1, 1, 1, 1]),
    crowns: [0],
    gum: new Set([1]),
    resolution,
  }).get(0)!;
  TestValidator.predicate("upright raster observes the independent ten-millimetre interval",
    nclose(measure(original).visible, 0.01, resolution));
  const angle = Math.PI / 6;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const tilted = [...original];
  for (let at = 0; at < tilted.length; at += 3) {
    tilted[at + 1] = original[at + 1] * cosine - original[at + 2] * sine;
    tilted[at + 2] = original[at + 1] * sine + original[at + 2] * cosine;
  }
  const zenith = [0, 0.01 * cosine - 0.0001 * sine, 0.01 * sine + 0.0001 * cosine];
  const axialHeight = zenith[1] * cosine + zenith[2] * sine;
  TestValidator.predicate("rigid rotation preserves the anatomical axial oracle",
    nclose(axialHeight, 0.01, 1e-12));
  TestValidator.predicate("the frontal display proxy changes under rotation",
    Math.abs(measure(tilted).visible - axialHeight) > resolution * 5);
  const incisal = { vertices: [0, 1], weights: [0.5, 0.5] };
  const registration = {
    basisRevision: "analytic-rotation",
    registrationId: "independently-constructed-planar-landmarks",
    axis: { incisal, cervical: { vertices: [2, 3], weights: [0.5, 0.5] } },
    incisalOrCusp: incisal,
    gingivalZenith: { vertices: [4, 5], weights: [0.5, 0.5] },
  };
  const moving = new Set([4, 5, 6, 7]);
  for (const positions of [original, tilted])
    TestValidator.predicate("registered clinical height retains the anatomical axial oracle",
      nclose(measureDentalClinicalHeight(positions, registration.basisRevision, registration, moving).heightMetres,
        axialHeight, 1e-12));
};
