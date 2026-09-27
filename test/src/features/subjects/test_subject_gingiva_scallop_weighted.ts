import { TestValidator } from "@nestia/e2e";

import { prepareGingivaScallopBasis } from "../../../scripts/face-review/prepareGingivaScallopBasis";
import { gingivaScallopFixture } from "../internal/gingivaScallopFixture";

/**
 * A jaw row weighted below one does not make its vertex's crown
 * mandibular to a scalloped gum; the octahedron's other rows still do.
 */
export const test_subject_gingiva_scallop_weighted = (): void => {
  const { basis, base } = gingivaScallopFixture();
  const weighted = structuredClone(basis);
  const jaw = weighted.surfaces
    .find((one) => one.id === "teeth")!
    .attachments!.find((one) => one.owner === "jaw")!;
  jaw.rows[jaw.rows.length - 1] = 0.5;
  TestValidator.predicate(
    "weighted",
    prepareGingivaScallopBasis({
      ...base,
      basis: weighted,
    }).receipt.anterior.every((one) => one.centre > 2),
  );
};
