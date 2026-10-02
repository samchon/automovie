import { TestValidator } from "@nestia/e2e";

import { describeHumanViewerPass } from "../../../scripts/human-viewer/describeHumanViewerPass";
import { humanViewerChoices } from "../../../scripts/human-viewer/humanViewerChoices";

/**
 * Every pass answers with a reading limit, and the wire pass says it sees through.
 *
 * Scenarios:
 * 1. Each named pass has a distinct non-empty statement.
 * 2. The wire statement names the far-side edges that show through, and the
 *    outline statement says it reads silhouette only.
 */
export const test_human_viewer_pass_reading = (): void => {
  const readings = humanViewerChoices.passes.map((pass) => describeHumanViewerPass(pass));
  TestValidator.predicate("non-empty", readings.every((text) => text.length > 0));
  TestValidator.equals("distinct", new Set(readings).size, humanViewerChoices.passes.length);
  TestValidator.predicate("wire sees through", describeHumanViewerPass("wire").includes("far-side edges showing through"));
  TestValidator.predicate("outline silhouette", describeHumanViewerPass("outline").includes("silhouette edges only"));
};
