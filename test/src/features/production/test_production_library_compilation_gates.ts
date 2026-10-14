import { compileAutoMovieLibrary } from "../../../../packages/production/src/production/compileAutoMovieLibrary";
import { TestValidator } from "@nestia/e2e";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual library compiler with typed resident project/runtime ports, checking design's no-evaluation/no-publication path, source/review/final complete candidate publication and read-only reopening with confirmation and unchanged input identity.
 * @evidence contracts/testing.md#independent-expectations The fixture authority reports acquired revision four and committed revision nine, with literal evaluation/confirmation/listing counts and design-disabled derivation observations. Candidate-size/fingerprint agreement tests internal handoff consistency; no filesystem commit or independent digest oracle is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Retains design and all three executing scopes, complete nonempty candidate, created statuses and read-only reopening without publication. Source/content races, authority errors and invalid contribution/ownership cases belong to compilation_currentness/refusal.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_compilation_gates owns the design case and all three loop scopes, including fixture callbacks. Publication is an in-memory authority observation; no project files are written and no actual source host or installed consumer runs.
 */
export function test_production_library_compilation_gates(): void {
  const design: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  const designed: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
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
    const attempt: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
    const output: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
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
      output.materialized.map((file: typeof output.materialized[number]): typeof file.status => file.status),
      Array.from(
        { length: output.materialized.length },
        (): "created" => "created" as const,
      ),
    );
    attempt.state.generated = attempt.state.committed![1];
    attempt.state.generatedBytes = attempt.state.committed![0];
    attempt.state.committed = null;
    const readonly: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
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
}
