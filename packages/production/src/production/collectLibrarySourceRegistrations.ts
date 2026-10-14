import type {
  IAutoMovieDiagnostic,
  IAutoMovieLibraryBuildContext,
  IAutoMovieLibraryContribution,
} from "@automovie/interface";
import typia from "typia";

import { admitAutoMovieLibraryDerivedContribution } from "./admitAutoMovieLibraryDerivedContribution";
import { compareCodeUnits } from "./contentIdentity";
import { autoMovieLibraryContributionDiagnostics } from "./autoMovieLibraryContributionDiagnostics";
import type { ICompiledLibraryOwnerRegistration } from "./ICompiledLibraryOwnerRegistration";
import type { resolveAutoMovieSourceOwnerBinding } from "./resolveAutoMovieSourceOwnerBinding";

/**
 * Collect the owner registrations one evaluated library module carries.
 *
 * The supplied loader and build calls share one catch boundary. After loading, this collector discovers exports naming a design, resolves active graph contexts, admits the exact owner edge and obtains a synchronous build result or selected derived JSON. Both forms receive the same contribution schema and branch checks; contexts normalize to a definite list.
 *
 * Executed-result schema and branch refusals point to the source file; precomputed-result refusals point to the selected artifact and its generator. The catch normally discards accumulated registrations while retaining findings, but its unguarded error-to-string conversion can itself throw on an unrepresentable thrown value. Authored effects are not rolled back.
 *
 * @evidence contracts/common.md#principled-implementation Discovers sorted own module-export keys, checks each design address and exact owner admission before building, then applies the contribution schema and branch carrier rules to executed and derived values alike. Contexts normalize once to a definite list.
 * @evidence contracts/common.md#clear-and-simple-design Separates loader capability, graph context/admission callbacks, derived JSON ingress and branch policy. The productionSources context is the existing compatibility path that bypasses standalone branch-carrier checks while still requiring the schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No named export receives a special result; synchronous executed contributions and digest-admitted derived contributions meet the same shape gate. The productionSources exception is explicit compatibility policy, and ordinary Node execution provides no sandbox or proof of deterministic effects.
 * @evidence contracts/common.md#meaningful-documentation States discovery, admission, executed/derived attribution and normalization. A caught loader, context, admission, build or validation failure normally discards registrations and appends an execution error, while unguarded catch formatting can throw instead; authored effects are not rolled back.
 * @evidence contracts/performance.md#efficient-algorithms Sorts K export names with O(K log K) code-unit comparisons whose cost depends on compared text, then visits candidates once with callback, clone, build, derived-ingress and schema costs driven by each contribution. Registration storage is proportional to admitted payloads; discovery retains O(K) descriptors and their referenced names for the call.
 * @evidence contracts/performance.md#reuse-equivalent-work Loads the module once per collection, normalizes contexts once per admitted contribution and reads already-created graph contexts through the callback. Mutable module effects and inputs are not cached or shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous collector owns local descriptors and arrays until transfer or failure; a catch transfers diagnostics and releases registration references. It acquires no handle, but the supplied loader and authored builders own any external effects or resident state they create.
 * @author Samchon
 */
export function collectLibrarySourceRegistrations(props: {
  /** Project-relative source path selected by an enforced graph binding. */
  path: string;

  /** Evaluate the selected module and return its named exports. */
  load: () => Readonly<Record<string, unknown>>;

  /** Build context for an address the active authoring population owns. */
  context: (design: string) => IAutoMovieLibraryBuildContext | null;

  /** Admit the exact graph-selected owner edge before invoking build(). */
  admit: (
    exportName: string,
    design: string,
  ) => ReturnType<typeof resolveAutoMovieSourceOwnerBinding>;
}): {
  /** Admitted owner contributions; empty after a successfully formatted caught execution failure. */
  registrations: ICompiledLibraryOwnerRegistration[];

  /** Collected source findings in discovery order, including any caught execution refusal. */
  diagnostics: IAutoMovieDiagnostic[];
} {
  const target: string = `library-source:${props.path}`;
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const registrations: ICompiledLibraryOwnerRegistration[] = [];
  let current: string = "the module";
  try {
    const exports: Readonly<Record<string, unknown>> = props.load();
    const discovered: Array<{
      name: string;
      design: string;
      derived: boolean;
      artifact: string | null;
      build: ((context: IAutoMovieLibraryBuildContext) => unknown) | undefined;
    }> = Object.keys(exports)
      .sort(compareCodeUnits)
      .flatMap((name: string): Array<{
        name: string;
        design: string;
        derived: boolean;
        artifact: string | null;
        build: ((context: IAutoMovieLibraryBuildContext) => unknown) | undefined;
      }> => {
        const value: unknown = exports[name];
        if (
          value === null ||
          typeof value !== "object" ||
          !("design" in value) ||
          typeof value.design !== "string"
        )
          return [];
        const build: ((context: IAutoMovieLibraryBuildContext) => unknown) | undefined =
          "build" in value && typeof value.build === "function"
            ? (value.build as (
                context: IAutoMovieLibraryBuildContext,
              ) => unknown)
            : undefined;
        if (build === undefined && !("derivedArtifact" in value)) return [];
        return [
          {
            name,
            design: value.design,
            derived: "derivedArtifact" in value,
            artifact:
              "derivedArtifact" in value &&
              typeof value.derivedArtifact === "string"
                ? value.derivedArtifact
                : null,
            build,
          },
        ];
      });
    for (const entry of discovered) {
      current = `export "${entry.name}"`;
      const context: IAutoMovieLibraryBuildContext | null = props.context(entry.design);
      if (context === null) {
        diagnostics.push({
          code: "source-registration-mismatch",
          category: "error",
          phase: "source",
          target: `${target}:${entry.name}`,
          path: props.path,
          message: `Library source export "${entry.name}" registers design owner ${JSON.stringify(entry.design)}, which is not an exact active design document and H2 anchor in this project's authoring declaration. Register one "docs/<branch>/<document>.md#<anchor>" address the graph already selects, or remove the export.`,
        });
        continue;
      }
      const admission: ReturnType<typeof resolveAutoMovieSourceOwnerBinding> = props.admit(entry.name, entry.design);
      if (admission.success === false) {
        diagnostics.push({
          code: "source-owner-mismatch",
          category: "error",
          phase: "source",
          target: `${target}:${entry.name}`,
          path: props.path,
          message: admission.message,
        });
        continue;
      }
      let value: unknown;
      // The derived artifact a precomputed owner selected, which is where its
      // schema and branch refusals send the author; null for an executed owner.
      let artifact: string | null = null;
      if (entry.derived) {
        const admitted: ReturnType<typeof admitAutoMovieLibraryDerivedContribution> = admitAutoMovieLibraryDerivedContribution({
          source: props.path,
          exportName: entry.name,
          derivedArtifact: entry.artifact,
          build: entry.build !== undefined,
          derivedArtifacts: context.derivedArtifacts,
        });
        if (admitted.success === false) {
          diagnostics.push(admitted.diagnostic);
          continue;
        }
        value = admitted.value;
        // Admission resolves only an own current path, so a string was named.
        artifact = entry.artifact!;
      } else {
        value = entry.build!(structuredClone(context));
        if (
          value !== null &&
          typeof value === "object" &&
          "then" in value &&
          typeof value.then === "function"
        ) {
          diagnostics.push({
            code: "source-export-invalid",
            category: "error",
            phase: "source",
            target: `${target}:${entry.name}`,
            path: props.path,
            message: `Library owner export "${entry.name}" returned a Promise. Return a synchronous deterministic library contribution from ${props.path}.`,
          });
          continue;
        }
      }
      const generatorCorrection: string | null =
        artifact === null
          ? null
          : `Correct the generator of derived artifact "${artifact}" selected by export "${entry.name}" in ${props.path}, run the explicit generation command, and compile again.`;
      const validation: typia.IValidation<IAutoMovieLibraryContribution> =
        typia.validateEquals<IAutoMovieLibraryContribution>(value);
      if (validation.success === false) {
        for (const error of validation.errors)
          diagnostics.push({
            code: "source-export-invalid",
            category: "error",
            phase: "source",
            target: `${target}:${entry.name}`,
            path: artifact ?? props.path,
            message: `${error.path} expects ${error.expected}. ${generatorCorrection ?? `Fix the returned library contribution in ${props.path}.`}`,
          });
        continue;
      }
      const contribution: ICompiledLibraryOwnerRegistration["contribution"] = {
        ...validation.data,
        contexts: validation.data.contexts ?? [],
      };
      const contributionDiagnostics: string[] =
        context.branch === "productionSources"
          ? []
          : autoMovieLibraryContributionDiagnostics(
              context.branch,
              contribution,
            );
      for (const message of contributionDiagnostics)
        diagnostics.push({
          code: "source-export-invalid",
          category: "error",
          phase: "source",
          target: `${target}:${entry.name}`,
          path: artifact ?? props.path,
          message:
            generatorCorrection === null
              ? message
              : `${message} ${generatorCorrection}`,
        });
      if (contributionDiagnostics.length !== 0) continue;
      registrations.push({
        export: entry.name,
        design: entry.design,
        // Executed and derived contributions share this normalization; the authored
        // contract allows omitted contexts, while downstream admission needs a list.
        contribution,
      });
    }
  } catch (error) {
    const message: string =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return {
      registrations: [],
      diagnostics: [
        ...diagnostics,
        {
          code: "source-execution-failed",
          category: "error",
          phase: "source",
          target,
          path: props.path,
          message: `Library source ${current} in ${props.path} failed while building its contribution: ${message}. No generated artifact was published. Correct the operation or precondition named by this fact, then rerun the same compile scope.`,
        },
      ],
    };
  }
  return { registrations, diagnostics };
}
