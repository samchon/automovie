import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import { AutoMovieProductionInputRaceError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";
import { loadSourceModule } from "../internal/loadSourceModule";

type Input = Omit<ReturnType<typeof createLibraryCompilationInput>["props"], "input" | "currentAuthoringEvidence"> & {
  input: { scope: "design" | "source" | "review" | "final" };
  currentAuthoringEvidence?: ReturnType<typeof createLibraryCompilationInput>["props"]["currentAuthoringEvidence"];
};
const { compileAutoMovieLibrary } = loadSourceModule<{
  compileAutoMovieLibrary(props: Input): IAutoMovieBuildProjectOutput;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/compileAutoMovieLibrary.ts"));

/**
 * A library answer remains tied to its acquired source and content identity.
 *
 * Scenarios:
 * 1. Missing live evidence refuses confirmation and publication instead of
 *    trusting the fixed declaration for a currentness verdict.
 * 2. Source or verified content moving during evaluation prevents publication.
 * 3. A live observation that throws at confirmation becomes an input race;
 *    unrelated authority failures still propagate unchanged.
 */
export const test_production_library_compilation_currentness = (): void => {
  for (const materialize of [false, true]) {
    const attempt = createLibraryCompilationInput();
    const result = compileAutoMovieLibrary({ ...attempt.props, materialize, currentAuthoringEvidence: undefined });
    TestValidator.equals("missing live reader refuses without published files", { success: result.success, materialized: result.materialized, committed: attempt.state.committed }, { success: false, materialized: [], committed: null });
    TestValidator.predicate("missing live reader is reported as an input race", result.diagnostics.some((diagnostic) => diagnostic.code === "compile-input-changed"));
  }
  for (const transition of ["source", "content", "observation"] as const) {
    const attempt = createLibraryCompilationInput();
    const originalEvaluator = attempt.props.runtime.evaluateSource;
    let moved = false;
    const result = compileAutoMovieLibrary({
      ...attempt.props,
      currentAuthoringEvidence: () => {
        if (moved && transition === "observation") throw new Error("Authoring observation is unavailable.");
        return attempt.state.evidence;
      },
      runtime: {
        ...attempt.props.runtime,
        evaluateSource: (request) => {
          const evaluated = originalEvaluator(request);
          moved = true;
          if (transition === "source") attempt.state.source += "// changed\n";
          if (transition === "content")
            attempt.state.derived = { ...attempt.state.derived, fields: [{ role: "content:changed", kind: "file", payload: Buffer.from("new content") }] };
          return evaluated;
        },
      },
    });
    TestValidator.equals("changed acquisition refuses the candidate", { moved, success: result.success, committed: attempt.state.committed, materialized: result.materialized }, { moved: true, success: false, committed: null, materialized: [] });
    TestValidator.predicate("changed acquisition has an explicit race diagnostic", result.diagnostics.some((diagnostic) => diagnostic.code === "compile-input-changed"));
  }
  const authority = createLibraryCompilationInput();
  const confirmationFailure = new Error("The root authority refused confirmation.");
  authority.state.confirmationFailure = confirmationFailure;
  let caught: unknown;
  try { compileAutoMovieLibrary({ ...authority.props, input: { scope: "design" } }); } catch (error) { caught = error; }
  TestValidator.predicate("non-race confirmation failure preserves exact identity", caught === confirmationFailure);
  authority.state.publicationFailure = new Error("The publication authority is unavailable.");
  try { compileAutoMovieLibrary(authority.props); } catch (error) { caught = error; }
  TestValidator.predicate("non-race publication failure preserves exact identity", caught === authority.state.publicationFailure);
  authority.state.publicationFailure = new AutoMovieProductionInputRaceError("Another input won publication.");
  const raced = compileAutoMovieLibrary(authority.props);
  TestValidator.equals("authority race publishes no status", { success: raced.success, materialized: raced.materialized }, { success: false, materialized: [] });
};
