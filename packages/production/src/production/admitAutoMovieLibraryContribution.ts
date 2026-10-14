import type {
  validateAutoMovieEnvironmentContext,
  validateBuiltEnvironment,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieDiagnostic,
  IAutoMovieModel,
} from "@automovie/interface";

import type { ICompiledLibraryOwnerRegistration } from "./ICompiledLibraryOwnerRegistration";
import { autoMovieSourceContentDiagnostic } from "./autoMovieSourceContentDiagnostic";
import { autoMovieSourceContentFinding } from "./autoMovieSourceContentFinding";
import { autoMovieValidationFindings } from "./autoMovieValidationFindings";

/**
 * Validate an admitted library contribution and claim its published identities.
 *
 * The source collector supplies schema-checked, graph-admitted registrations. The compilation's validators own environment, model and context validity; this owner translates their findings and prevents two source owners from writing the same artifact identity. All ownership maps and the model index belong to one compilation attempt, and mutations remain even after refusal so a later source cannot silently take over an identity claimed earlier.
 *
 * Environments are checked first, then models, then world contexts, retaining the existing diagnostic order. A unique model enters the shared index even if validation reports a failure; the complete attempt must refuse its publication. Duplicate models never replace the first indexed model. Only new error diagnostics make this contribution fail; older findings and warnings remain attached to the attempt without changing this gate's result. Supplied validator exceptions propagate without rolling back earlier claims.
 *
 * @evidence contracts/common.md#principled-implementation Applies each supplied carrier validator, translates warnings and errors unchanged and claims IDs before later owners can reuse them. The collector supplies schema-checked normalized contributions, including a present contexts array.
 * @evidence contracts/common.md#clear-and-simple-design Owns library identity admission and shared model indexing within one attempt; validator implementations own domain rules and the source-content adapters own diagnostic classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts First ownership claims and unique model entries survive a refused contribution, preventing a later source from silently replacing them. Invalid indexed models cannot authorize publication because the complete attempt retains their errors.
 * @evidence contracts/common.md#meaningful-documentation States carrier order, mutation ownership, duplicate precedence and the new-error-only verdict; the function neither rolls back the caller's maps nor publishes artifacts.
 * @evidence contracts/performance.md#efficient-algorithms Visits every environment, model and context once with their validator costs and Map claims; new diagnostics are scanned once for error severity. The final slice allocates O(D) temporary references for D diagnostics emitted by this contribution.
 * @evidence contracts/performance.md#reuse-equivalent-work All registrations share the attempt's owner maps and model index, so duplicate identity claims consult existing ownership instead of rebuilding an inventory. Validation remains occurrence-specific and is not cached across mutable carrier values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned maps grow with distinct contributed IDs and diagnostics with findings for the finite attempt; mutations persist through refusal until the attempt releases them. The helper acquires no handle or background task.
 */
export function admitAutoMovieLibraryContribution(props: {
  /** First design owner claiming each context id during this attempt. */
  contextOwner: Map<string, string>;

  /** Attempt-owned sink retaining prior findings and newly attributed errors or warnings. */
  diagnostics: IAutoMovieDiagnostic[];

  /** First design owner claiming each built-environment id during this attempt. */
  environmentOwner: Map<string, string>;

  /** First design owner claiming each model id; duplicate claims leave this map unchanged. */
  modelOwner: Map<string, string>;

  /** Attempt-owned index receiving every uniquely claimed model, including refused models. */
  models: Map<string, IAutoMovieModel>;

  /** Schema-checked, graph-admitted contribution with a normalized contexts list. */
  registration: ICompiledLibraryOwnerRegistration;

  /** Source path used for attribution rather than read or resolved here. */
  source: string;

  /** Source-phase diagnostic address supplied by the evaluation owner. */
  target: string;

  /** Domain validators composed by the compilation host for these carriers. */
  validators: {
    /** Built-environment gate whose complete findings feed this contribution. */
    environment: typeof validateBuiltEnvironment;

    /** Model gate whose findings precede this model's identity claim. */
    model: typeof validateModel;

    /** World-context gate whose findings precede this context's identity claim. */
    context: typeof validateAutoMovieEnvironmentContext;
  };
}): boolean {
  const before: number = props.diagnostics.length;
  // Supplied validator paths lose the fixed $input prefix length for source-relative attribution; this adapter does not validate that prefix.
  function report(violation: IAutoMovieConstraintViolation): void {
    props.diagnostics.push(
      autoMovieSourceContentDiagnostic({
        finding: autoMovieSourceContentFinding(
          violation,
          `Library owner "${props.registration.design}" publishes ${violation.path.slice("$input".length)} that ${violation.expected}. Correct ${props.source} before compiling.`,
        ),
        target: props.target,
        path: props.source,
      }),
    );
  }
  function claim(
    owners: Map<string, string>,
    id: string,
    kind: string,
  ): boolean {
    const previous: string | undefined = owners.get(id);
    if (previous !== undefined) {
      props.diagnostics.push({
        code: "source-export-invalid",
        category: "error",
        phase: "source",
        target: props.target,
        path: props.source,
        message: `Library ${kind} "${id}" is published by both "${previous}" and "${props.registration.design}". Give every published ${kind} one owner; two owners write one builder-owned file twice.`,
      });
      return false;
    }
    owners.set(id, props.registration.design);
    return true;
  }
  for (const environment of props.registration.contribution.environments) {
    for (const violation of autoMovieValidationFindings(
      props.validators.environment({ environment }),
    ))
      report(violation);
    claim(props.environmentOwner, environment.id, "built environment");
  }
  for (const model of props.registration.contribution.models) {
    for (const violation of autoMovieValidationFindings(
      props.validators.model({ model }),
    ))
      report(violation);
    if (claim(props.modelOwner, model.id, "model"))
      props.models.set(model.id, model);
  }
  for (const context of props.registration.contribution.contexts) {
    for (const violation of autoMovieValidationFindings(
      props.validators.context({ context }),
    ))
      report(violation);
    claim(props.contextOwner, context.id, "environment context");
  }
  return props.diagnostics
    .slice(before)
    .every((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category !== "error");
}
