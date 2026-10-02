import type { validateAutoMovieEnvironmentContext, validateBuiltEnvironment, validateModel } from "@automovie/engine";
import type { IAutoMovieConstraintViolation, IAutoMovieDiagnostic, IAutoMovieModel } from "@automovie/interface";
import type { ICompiledLibraryOwnerRegistration } from "./productionSourceBuild";
import { autoMovieSourceContentDiagnostic, autoMovieSourceContentFinding, autoMovieValidationFindings } from "./sourceContentDiagnostics";

/**
 * Validate an admitted library contribution and claim its published identities.
 *
 * The source collector supplies schema-checked, graph-admitted registrations.
 * The compilation's validators own environment, model and context validity; this
 * owner translates their findings and prevents two source owners from writing
 * the same artifact identity. All ownership maps and the model index belong
 * to one compilation attempt, and mutations remain even after refusal so a
 * later source cannot silently take over an identity claimed earlier.
 *
 * Environments are checked first, then models, then world contexts, retaining
 * the existing diagnostic order. A unique model enters the shared index even
 * if validation reports a failure; the complete attempt must refuse its
 * publication. Duplicate models never replace the first indexed model. Only
 * new error diagnostics make this contribution fail; older findings and
 * warnings remain attached to the attempt without changing this gate's result.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Refuses invalid or multiply owned library contributions before their results can enter the successful publication closure.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Keeps an invalid or multiply owned contribution out of the complete success closure while retaining structured findings for its source target.
 */
export const admitAutoMovieLibraryContribution = (props: {
    contextOwner: Map<string, string>;
    diagnostics: IAutoMovieDiagnostic[];
    environmentOwner: Map<string, string>;
    modelOwner: Map<string, string>;
    models: Map<string, IAutoMovieModel>;
    registration: ICompiledLibraryOwnerRegistration;
    source: string;
    target: string;
    /** Domain validators composed by the compilation host for these carriers. */
    validators: {
      environment: typeof validateBuiltEnvironment;
      model: typeof validateModel;
      context: typeof validateAutoMovieEnvironmentContext;
    };
  }): boolean => {
  const before = props.diagnostics.length;
  // The path is sliced and printed without a fallback because the three
  // validators below build every violation path from `$input.` and none
  // ever reports at the bare root: a contribution that is not a record at all
  // is refused earlier, by the shape check on what `build()` returned, with a
  // message of its own. A fallback for the empty remainder was a second
  // sentence for a case that cannot arrive here, and no test could reach it.
  const report = (violation: IAutoMovieConstraintViolation): void => {
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
  };
  const claim = (
    owners: Map<string, string>,
    id: string,
    kind: string,
  ): boolean => {
    const previous = owners.get(id);
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
  };
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
    .every((diagnostic) => diagnostic.category !== "error");
};
