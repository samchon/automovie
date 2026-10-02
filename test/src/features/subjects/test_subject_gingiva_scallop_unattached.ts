import { TestValidator } from "@nestia/e2e";

import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";
import { throwsError } from "../internal/predicates";

/**
 * Removing attachments makes a previously mandibular crown enter the upper
 * set. Its clinical landmarks were never registered, so the norm-driven
 * preparation refuses rather than guessing a gingival zenith for that crown.
 */
export const test_subject_gingiva_scallop_unattached = (): void => {
  const { basis, base } = gingivaScallopFixture();
  const unattached = structuredClone(basis);
  delete unattached.surfaces.find((one) => one.id === "teeth")!.attachments;
  TestValidator.predicate(
    "unattached",
    throwsError(() => prepareGingivaScallopBasis({
      ...base,
      basis: unattached,
    }), ["Clinical crown height needs landmark registration"]),
  );
};
