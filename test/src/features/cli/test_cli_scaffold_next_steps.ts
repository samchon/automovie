import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

/** The CLI hint's callable boundary, loaded from its maintained source. */
interface INextStepsModule {
  renderAutoMovieScaffoldNextSteps: (directory: string) => string;
}

const { renderAutoMovieScaffoldNextSteps } = loadSourceModule<INextStepsModule>(
  path.resolve(__dirname, "../../../../packages/cli/src/scaffoldNextSteps.ts"),
);

/**
 * A created project's next steps expose both independent validation commands.
 *
 * Scenarios:
 * 1. The requested directory remains the command context and both source lint
 *    and authored evidence checks are named before the production is executed.
 */
export const test_cli_scaffold_next_steps = (): void => {
  const hint = renderAutoMovieScaffoldNextSteps("a-production");
  TestValidator.predicate(
    "requested command context",
    hint.includes("from a-production"),
  );
  TestValidator.predicate(
    "source validation is reachable",
    hint.includes("npm run lint for source"),
  );
  TestValidator.predicate(
    "authored graph validation is reachable",
    hint.includes("npm run evidence for authored evidence"),
  );
};
