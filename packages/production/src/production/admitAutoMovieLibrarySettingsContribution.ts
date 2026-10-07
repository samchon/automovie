import type { IAutoMovieDiagnostic } from "@automovie/interface";

import type { ICompiledLibraryOwnerRegistration } from "./productionSourceBuild";

/**
 * Admit a settings source only as a zero-payload library lineage result.
 *
 * The source collector already admitted this exact design/export owner and
 * normalized its contribution lists. Settings describes a production rather
 * than publishing its semantic artifacts, so any environment, model or world
 * context belongs to a design-source owner. This gate appends one refusal to
 * the caller's diagnostics and returns false; it never rewrites a contribution.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Refuses nonempty settings payloads before they enter a library publication closure instead of substituting another owner's artifact.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Leaves nonempty settings output as a structured source failure rather than mixing semantic artifacts into its lineage-only result.
 */
export const admitAutoMovieLibrarySettingsContribution = (props: {
  diagnostics: IAutoMovieDiagnostic[];
  registration: ICompiledLibraryOwnerRegistration;
  source: string;
  target: string;
}): boolean => {
  const contribution = props.registration.contribution;
  const populations =
    contribution.environments.length +
    contribution.models.length +
    contribution.contexts.length;
  if (populations === 0) return true;
  props.diagnostics.push({
    code: "source-export-invalid",
    category: "error",
    phase: "source",
    target: props.target,
    path: props.source,
    message: `Production source export "${props.registration.export}" serializes settings and must return empty environments, models, and contexts. Publish semantic artifacts from their reviewed design-source owner instead.`,
  });
  return false;
};
