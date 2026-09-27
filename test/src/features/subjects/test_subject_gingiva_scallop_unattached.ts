import { TestValidator } from "@nestia/e2e";

import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";

/**
 * Without attachments the fixture's lower octahedron is an upper crown to a
 * scalloped gum, the one at the midline.
 */
export const test_subject_gingiva_scallop_unattached = (): void => {
  const { basis, base } = gingivaScallopFixture();
  const unattached = structuredClone(basis);
  delete unattached.surfaces.find((one) => one.id === "teeth")!.attachments;
  TestValidator.predicate(
    "unattached",
    prepareGingivaScallopBasis({
      ...base,
      basis: unattached,
    }).receipt.anterior.some((one) => Math.abs(one.centre) < 1e-9),
  );
};
