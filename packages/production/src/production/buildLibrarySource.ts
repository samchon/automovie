import type { IAutoMovieDiagnostic, IAutoMovieLibraryBuildContext } from "@automovie/interface";
import { createRequire } from "node:module";
import path from "node:path";
import type { ICompiledLibraryOwnerRegistration } from "./ICompiledLibraryOwnerRegistration";
import { collectLibrarySourceRegistrations } from "./collectLibrarySourceRegistrations";
import type { resolveAutoMovieSourceOwnerBinding } from "./resolveAutoMovieSourceOwnerBinding";

/**
 * Load an authored library module through Node and collect its admitted owners.
 *
 * @evidence contracts/common.md#principled-implementation Node loads the selected project module and the collector discovers each registration, admits exact graph-selected owner edges and validates synchronous contributions or precomputed derived records against their branch contract.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper owns actual module evaluation while collectLibrarySourceRegistrations owns registration discovery/admission; the library coordinator supplies verified owner contexts and derivations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authors must provide deterministic source but Node execution is not sandboxed and the normalized source parameter is provenance only, not the executed buffer. No regex spelling check can prove effects deterministic.
 * @evidence contracts/common.md#meaningful-documentation States ordinary loader execution, exact owner admission, contribution collection and absence of runtime determinism enforcement.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes arbitrary module effects/dependency loading plus collection over named exports and each contribution/derived admission. There is no authored-execution timeout or byte cap in this wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work The build coordinator evicts the project closure per attempt and Node shares loaded dependencies during that attempt; no contribution answer is cached across changing owner/context/derived inputs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Node module cache retains loaded exports until eviction and the compile attempt owns returned contribution/diagnostic records. Authored code owns any handles or tasks it starts; the wrapper provides no sandbox/cancellation cleanup.
 */
export function buildLibrarySource(props: {
  /** Project-relative source path selected by an enforced graph binding. */
  path: string;

  /** Caller-supplied normalized source text; this loader does not read or execute the field. */
  source: string;

  /** Physical project root used by Node's ordinary module resolver. */
  sourceRoot: string;

  /** Build context for an address the active authoring population owns. */
  context: (design: string) => IAutoMovieLibraryBuildContext | null;

  /** Admit the exact graph-selected owner edge before invoking build(). */
  admit: (
    exportName: string,
    design: string,
  ) => ReturnType<typeof resolveAutoMovieSourceOwnerBinding>;
}): {
  registrations: ICompiledLibraryOwnerRegistration[];
  diagnostics: IAutoMovieDiagnostic[];
} {
  return collectLibrarySourceRegistrations({
    path: props.path,
    load: (): Readonly<Record<string, unknown>> =>
      createRequire(path.join(props.sourceRoot, "package.json"))(
        path.resolve(props.sourceRoot, props.path),
      ) as Readonly<Record<string, unknown>>,
    context: props.context,
    admit: props.admit,
  });
}
