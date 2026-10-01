import { TestValidator } from "@nestia/e2e";

import { prepareGingivaBasis } from "../../../scripts/face-review/prepareGingivaBasis";
import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { throwsError } from "../internal/predicates";

/**
 * An axial norm shortfall must have a positive response to the admitted gum
 * motion. A horizontal registered axis cannot be corrected by lifting gum Y.
 *
 * Scenarios:
 * 1. Replace only the registered axis with a known horizontal box edge. Both
 *    consumers refuse zero response, instead of dividing by it or moving data.
 */
export const test_subject_gingiva_clinical_motion_direction = (): void => {
  const { base, offset } = gingivaScallopFixture();
  const registrations = new Map([...base.registrations].map(([component, one]) =>
    [component, { ...one, axis: {
      incisal: { vertices: [offset], weights: [1] },
      cervical: { vertices: [offset + 1], weights: [1] },
    } }]));
  for (const prepare of [prepareGingivaBasis, prepareGingivaScallopBasis])
    TestValidator.predicate("zero clinical response refuses",
      throwsError(() => prepare({ ...base, registrations }), ["cervical direction"]));
};
