import type { IAutoMovieDiagnostic } from "@automovie/interface";
import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import { compileAutoMovieLibrary } from "../../../../packages/production/src/production/compileAutoMovieLibrary";
import { AutoMovieProductionInputRaceError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";

/**
 * A library answer remains tied to its acquired source and content identity.
 *
 * Scenarios:
 * 1. Missing live evidence refuses confirmation and publication instead of
 *    trusting the fixed declaration for a currentness verdict.
 * 2. Source or verified content moving during evaluation prevents publication.
 * 3. A live observation that throws at confirmation becomes an input race;
 *    unrelated authority failures still propagate unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual library compilation through typed resident ports with absent live evidence, source/content movement and throwing fresh observation, requiring explicit input-race diagnostics and no publication/status. It also requires unrelated confirmation/publication errors to propagate by exact object identity.
 * @evidence contracts/testing.md#independent-expectations Authored source/content mutations change acquired inputs and a missing/throwing fresh observer cannot attest currentness. Literal compile-input-changed, null commit/empty materialization and independently created error identities establish refusal; injected authority callbacks do not prove real filesystem locking.
 * @evidence contracts/testing.md#distinguishing-cases Retains absent observer for read-only/publishing attempts, source/content/observation transitions, distinct non-race confirmation and publication failures and an authority input-race failure. Stable publication/read-only confirmation and malformed inputs belong to compilation_gates/refusal.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_compilation_currentness owns both missing-reader cases, all three transition cases and authority failures, including injected evaluator assertions. It performs portable synchronous protocol execution with no files written, source host or consumer installed.
 */
export function test_production_library_compilation_currentness(): void {
  for (const materialize of [false, true]) {
    const attempt: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
    const result: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
      ...attempt.props,
      materialize,
      currentAuthoringEvidence: undefined,
    });
    TestValidator.equals(
      "missing live reader refuses without published files",
      {
        success: result.success,
        materialized: result.materialized,
        committed: attempt.state.committed,
      },
      { success: false, materialized: [], committed: null },
    );
    TestValidator.predicate(
      "missing live reader is reported as an input race",
      result.diagnostics.some(
        (diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.code === "compile-input-changed",
      ),
    );
  }
  for (const transition of ["source", "content", "observation"] as const) {
    const attempt: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
    const originalEvaluator: typeof attempt.props.runtime.evaluateSource = attempt.props.runtime.evaluateSource;
    let moved: boolean = false;
    const result: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
      ...attempt.props,
      currentAuthoringEvidence: (): IAutoMovieProductionEvidence => {
        if (moved && transition === "observation")
          throw new Error("Authoring observation is unavailable.");
        return attempt.state.evidence;
      },
      runtime: {
        ...attempt.props.runtime,
        evaluateSource: (request: Parameters<typeof originalEvaluator>[0]): ReturnType<typeof originalEvaluator> => {
          const evaluated: ReturnType<typeof originalEvaluator> = originalEvaluator(request);
          moved = true;
          if (transition === "source") attempt.state.source += "// changed\n";
          if (transition === "content")
            attempt.state.derived = {
              ...attempt.state.derived,
              fields: [
                {
                  role: "content:changed",
                  kind: "file",
                  payload: Buffer.from("new content"),
                },
              ],
            };
          return evaluated;
        },
      },
    });
    TestValidator.equals(
      "changed acquisition refuses the candidate",
      {
        moved,
        success: result.success,
        committed: attempt.state.committed,
        materialized: result.materialized,
      },
      { moved: true, success: false, committed: null, materialized: [] },
    );
    TestValidator.predicate(
      "changed acquisition has an explicit race diagnostic",
      result.diagnostics.some(
        (diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.code === "compile-input-changed",
      ),
    );
  }
  const authority: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  const confirmationFailure: Error = new Error(
    "The root authority refused confirmation.",
  );
  authority.state.confirmationFailure = confirmationFailure;
  let caught: unknown;
  try {
    compileAutoMovieLibrary({ ...authority.props, input: { scope: "design" } });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "non-race confirmation failure preserves exact identity",
    caught === confirmationFailure,
  );
  authority.state.publicationFailure = new Error(
    "The publication authority is unavailable.",
  );
  try {
    compileAutoMovieLibrary(authority.props);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "non-race publication failure preserves exact identity",
    caught === authority.state.publicationFailure,
  );
  authority.state.publicationFailure = new AutoMovieProductionInputRaceError(
    "Another input won publication.",
  );
  const raced: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary(authority.props);
  TestValidator.equals(
    "authority race publishes no status",
    { success: raced.success, materialized: raced.materialized },
    { success: false, materialized: [] },
  );
}
