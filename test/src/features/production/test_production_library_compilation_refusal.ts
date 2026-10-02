import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";
import { loadSourceModule } from "../internal/loadSourceModule";

const { compileAutoMovieLibrary } = loadSourceModule<{
  compileAutoMovieLibrary(props: Omit<ReturnType<typeof createLibraryCompilationInput>["props"], "input"> & {
    input: { scope: "design" | "source" | "review" | "final" };
  }): IAutoMovieBuildProjectOutput;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/compileAutoMovieLibrary.ts"));

/**
 * Library failures retain their exact scope and prevent complete publication.
 *
 * Scenarios:
 * 1. Invalid derived inputs suppress execution and retain both the content
 *    refusal and unregistered settings owner diagnostic.
 * 2. A stale graph source digest reports execution admission failure without
 *    invoking an owner build or publishing its artifacts.
 * 3. Missing read-only generated ownership is not repaired, while an empty
 *    selected source population remains a valid empty library result.
 * 4. An unavailable selected source keeps both acquisition and execution
 *    refusal visible instead of materializing an absent contribution.
 */
export const test_production_library_compilation_refusal = (): void => {
  const derived = createLibraryCompilationInput();
  const refusal = { code: "content-input-unsafe" as const, category: "error" as const, phase: "source" as const, target: "declared-content", path: null, message: "The declared content was refused." };
  derived.state.derived.diagnostics = [refusal];
  const blocked = compileAutoMovieLibrary({ ...derived.props, input: { scope: "review" } });
  TestValidator.equals("content refusal prevents evaluation and publication", { success: blocked.success, evaluations: derived.state.evaluations, committed: derived.state.committed, confirmations: derived.state.confirmations }, { success: false, evaluations: 0, committed: null, confirmations: 1 });
  TestValidator.predicate("content refusal retains its exact finding", blocked.diagnostics.includes(refusal));
  TestValidator.predicate("missing settings realization blocks review", blocked.diagnostics.some((diagnostic) => diagnostic.code === "source-export-missing" && diagnostic.category === "error"));
  const stale = createLibraryCompilationInput();
  stale.state.source += "// edited before acquisition\n";
  const inadmissible = compileAutoMovieLibrary(stale.props);
  TestValidator.equals("stale owner binding cannot publish", { success: inadmissible.success, committed: stale.state.committed }, { success: false, committed: null });
  TestValidator.predicate("stale execution plan attributes owner mismatch", inadmissible.diagnostics.some((diagnostic) => diagnostic.code === "source-owner-mismatch" && diagnostic.target === "library-source-owners"));
  const readonly = createLibraryCompilationInput();
  const missing = compileAutoMovieLibrary({ ...readonly.props, materialize: false });
  TestValidator.equals("readonly gate never repairs missing output", { success: missing.success, committed: readonly.state.committed, materialized: missing.materialized }, { success: false, committed: null, materialized: [] });
  TestValidator.predicate("readonly missing ownership is an error", missing.diagnostics.some((diagnostic) => diagnostic.code === "generated-manifest-missing" && diagnostic.category === "error"));
  const empty = createLibraryCompilationInput();
  empty.state.evidence = { ...empty.state.evidence, sourceOwners: [] };
  const compiledEmpty = compileAutoMovieLibrary(empty.props);
  TestValidator.equals("true empty source population does not execute an owner", { success: compiledEmpty.success, evaluations: empty.state.evaluations }, { success: true, evaluations: 0 });
  const unavailable = createLibraryCompilationInput();
  const cause = new Error("Selected source member is unavailable.");
  const unavailableResult = compileAutoMovieLibrary({
    ...unavailable.props,
    project: { ...unavailable.props.project, readSource: () => { throw cause; } },
  });
  TestValidator.equals("unavailable source cannot publish or execute", { success: unavailableResult.success, evaluations: unavailable.state.evaluations, committed: unavailable.state.committed }, { success: false, evaluations: 0, committed: null });
  TestValidator.predicate("unavailable source is attributed to its selected member", unavailableResult.diagnostics.some((diagnostic) => diagnostic.code === "source-path-missing" && diagnostic.path === "src/production.ts" && diagnostic.message.includes(cause.message)));
};
