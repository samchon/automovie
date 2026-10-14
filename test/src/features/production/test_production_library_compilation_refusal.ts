import type { IAutoMovieDiagnostic } from "@automovie/interface";
import { compileAutoMovieLibrary } from "../../../../packages/production/src/production/compileAutoMovieLibrary";
import { TestValidator } from "@nestia/e2e";

import { createLibraryCompilationInput } from "../internal/createLibraryCompilationInput";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles library attempts with refused derived inputs, stale source identity, missing read-only ownership, empty selected owners and unavailable selected bytes; asserts nonpublication/no evaluation where required and exact diagnostic identity/code/target/path attribution.
 * @evidence contracts/testing.md#independent-expectations Authored refusal object identity and literal error categories/codes distinguish content, source-owner, generated-manifest and unavailable-path failures. Empty selection expects successful zero evaluations; injected authority counters and null commit represent protocol effects rather than real persisted files.
 * @evidence contracts/testing.md#distinguishing-cases Retains all four groups and the valid empty-population neighbor, preserves partial findings and requires missing settings realization alongside content refusal. Successful scoped publication and later mutable-input races belong to compilation_gates/currentness.
 * @evidence contracts/testing.md#execution-ownership The named test_production_library_compilation_refusal owns all portable synchronous compiler/refusal cases and its injected throwing reader. It uses resident project/runtime ports, replaces no global methods and writes no project or generated files.
 */
export function test_production_library_compilation_refusal(): void {
  const derived: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  const refusal: IAutoMovieDiagnostic = {
    code: "content-input-unsafe" as const,
    category: "error" as const,
    phase: "source" as const,
    target: "declared-content",
    path: null,
    message: "The declared content was refused.",
  };
  derived.state.derived.diagnostics = [refusal];
  const blocked: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
    ...derived.props,
    input: { scope: "review" },
  });
  TestValidator.equals(
    "content refusal prevents evaluation and publication",
    {
      success: blocked.success,
      evaluations: derived.state.evaluations,
      committed: derived.state.committed,
      confirmations: derived.state.confirmations,
    },
    { success: false, evaluations: 0, committed: null, confirmations: 1 },
  );
  TestValidator.predicate(
    "content refusal retains its exact finding",
    blocked.diagnostics.includes(refusal),
  );
  TestValidator.predicate(
    "missing settings realization blocks review",
    blocked.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic): boolean =>
        diagnostic.code === "source-export-missing" &&
        diagnostic.category === "error",
    ),
  );
  const stale: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  stale.state.source += "// edited before acquisition\n";
  const inadmissible: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary(stale.props);
  TestValidator.equals(
    "stale owner binding cannot publish",
    { success: inadmissible.success, committed: stale.state.committed },
    { success: false, committed: null },
  );
  TestValidator.predicate(
    "stale execution plan attributes owner mismatch",
    inadmissible.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic): boolean =>
        diagnostic.code === "source-owner-mismatch" &&
        diagnostic.target === "library-source-owners",
    ),
  );
  const readonly: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  const missing: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
    ...readonly.props,
    materialize: false,
  });
  TestValidator.equals(
    "readonly gate never repairs missing output",
    {
      success: missing.success,
      committed: readonly.state.committed,
      materialized: missing.materialized,
    },
    { success: false, committed: null, materialized: [] },
  );
  TestValidator.predicate(
    "readonly missing ownership is an error",
    missing.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic): boolean =>
        diagnostic.code === "generated-manifest-missing" &&
        diagnostic.category === "error",
    ),
  );
  const empty: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  empty.state.evidence = { ...empty.state.evidence, sourceOwners: [] };
  const compiledEmpty: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary(empty.props);
  TestValidator.equals(
    "true empty source population does not execute an owner",
    { success: compiledEmpty.success, evaluations: empty.state.evaluations },
    { success: true, evaluations: 0 },
  );
  const unavailable: ReturnType<typeof createLibraryCompilationInput> = createLibraryCompilationInput();
  const cause: Error = new Error("Selected source member is unavailable.");
  const unavailableResult: ReturnType<typeof compileAutoMovieLibrary> = compileAutoMovieLibrary({
    ...unavailable.props,
    project: {
      ...unavailable.props.project,
      readSource: (): never => {
        throw cause;
      },
    },
  });
  TestValidator.equals(
    "unavailable source cannot publish or execute",
    {
      success: unavailableResult.success,
      evaluations: unavailable.state.evaluations,
      committed: unavailable.state.committed,
    },
    { success: false, evaluations: 0, committed: null },
  );
  TestValidator.predicate(
    "unavailable source is attributed to its selected member",
    unavailableResult.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic): boolean =>
        diagnostic.code === "source-path-missing" &&
        diagnostic.path === "src/production.ts" &&
        diagnostic.message.includes(cause.message),
    ),
  );
}
