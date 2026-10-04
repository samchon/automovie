import { TestValidator } from "@nestia/e2e";

import { describeHumanViewerPass } from "../../../scripts/human-viewer/describeHumanViewerPass";
import { humanViewerChoices } from "../../../scripts/human-viewer/humanViewerChoices";
import { getHumanObservationPassDefinition } from "@automovie/playground/src/human/common/observation/getHumanObservationPassDefinition";

/**
 * HTTP pass metadata delegates to the actual product material owner.
 *
 * Scenarios:
 * 1. Each named pass has a distinct non-empty statement.
 * 2. Every admitted HTTP pass uses the same source definition as its material
 *    constructor, including the separately named albedo pass and legacy flat.
 */
export const test_human_viewer_pass_reading = (): void => {
  const readings = humanViewerChoices.passes.map((pass) => describeHumanViewerPass(pass));
  TestValidator.predicate("non-empty", readings.every((text) => text.length > 0));
  TestValidator.equals("distinct", new Set(readings).size, humanViewerChoices.passes.length);
  for (const pass of humanViewerChoices.passes)
    TestValidator.equals("header consumes the construction owner's reading", describeHumanViewerPass(pass), getHumanObservationPassDefinition(pass).reading);
};
