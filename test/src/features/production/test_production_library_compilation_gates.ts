import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";
import { loadSourceModule } from "../internal/loadSourceModule";

const { compileAutoMovieLibrary } = loadSourceModule<{
  compileAutoMovieLibrary(
    props: Omit<
      ReturnType<typeof createLibraryCompilationInput>["props"],
      "input"
    > & {
      input: { scope: "design" | "source" | "review" | "final" };
    },
  ): IAutoMovieBuildProjectOutput;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/compileAutoMovieLibrary.ts",
  ),
);

/**
 * Library gates acquire one identity and separate confirmation from publication.
 *
 * Scenarios:
 * 1. Design scope reads authoring identity but neither executes source nor
 *    observes generated output, and confirms without publishing.
 * 2. Source, review and final gates execute exact settings ownership and publish
 *    one complete candidate with the acquired revision and live guard.
 * 3. Reopening the same candidate through a read-only gate confirms currentness
 *    without repairing bytes or invoking publication again.
 */
export const test_production_library_compilation_gates = (): void => {
  const design = createLibraryCompilationInput();
  const designed = compileAutoMovieLibrary({
    ...design.props,
    input: { scope: "design" },
  });
  TestValidator.equals(
    "design acquires identity without executing or publishing",
    {
      success: designed.success,
      revision: designed.revision,
      materialized: designed.materialized,
      evaluations: design.state.evaluations,
      listings: design.state.listings,
      confirmations: design.state.confirmations,
      publication: design.state.committed,
      derived: design.state.derivedReads,
    },
    {
      success: true,
      revision: 4,
      materialized: [],
      evaluations: 0,
      listings: 0,
      confirmations: 1,
      publication: null,
      derived: [false, false],
    },
  );
  for (const scope of ["source", "review", "final"] as const) {
    const attempt = createLibraryCompilationInput();
    const output = compileAutoMovieLibrary({
      ...attempt.props,
      input: { scope },
    });
    TestValidator.equals(
      "passed gate publishes the authority's committed revision",
      {
        success: output.success,
        revision: output.revision,
        evaluations: attempt.state.evaluations,
        confirmations: attempt.state.confirmations,
      },
      { success: true, revision: 9, evaluations: 1, confirmations: 0 },
    );
    TestValidator.predicate(
      "publication contains a complete nonempty candidate",
      attempt.state.committed !== null &&
        attempt.state.committed[0].size > 0 &&
        output.materialized.length === attempt.state.committed[0].size,
    );
    TestValidator.equals(
      "publication carries the result's exact input identity",
      attempt.state.committed![1].inputFingerprint,
      output.builder.inputFingerprint,
    );
    TestValidator.equals(
      "new candidate statuses are created",
      output.materialized.map((file) => file.status),
      Array.from(
        { length: output.materialized.length },
        () => "created" as const,
      ),
    );
    attempt.state.generated = attempt.state.committed![1];
    attempt.state.generatedBytes = attempt.state.committed![0];
    attempt.state.committed = null;
    const readonly = compileAutoMovieLibrary({
      ...attempt.props,
      input: { scope },
      materialize: false,
    });
    TestValidator.equals(
      "read-only reopening confirms without publishing",
      {
        success: readonly.success,
        materialized: readonly.materialized,
        committed: attempt.state.committed,
        confirmations: attempt.state.confirmations,
        diagnostics: readonly.diagnostics,
      },
      {
        success: true,
        materialized: [],
        committed: null,
        confirmations: 1,
        diagnostics: [],
      },
    );
    TestValidator.equals(
      "read-only answer retains the same input identity",
      readonly.builder.inputFingerprint,
      output.builder.inputFingerprint,
    );
  }
};
