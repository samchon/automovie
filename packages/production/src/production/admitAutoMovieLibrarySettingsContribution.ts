import type { IAutoMovieDiagnostic } from "@automovie/interface";

import type { ICompiledLibraryOwnerRegistration } from "./ICompiledLibraryOwnerRegistration";

/**
 * Admit a settings source only as a zero-payload library lineage result.
 *
 * The source collector already admitted this exact design/export owner and
 * normalized its contribution lists. Settings describes a production rather
 * than publishing its semantic artifacts, so any environment, model or world
 * context belongs to a design-source owner. This gate appends one refusal to
 * the caller's diagnostics and returns false; it never rewrites a contribution.
 *
 * @evidence contracts/common.md#principled-implementation Sums the three schema-validated, normalized carrier lengths and admits only zero payload; evaluateAutoMovieLibraryOwners routes productionSources settings here because settings serialize configuration rather than semantic library artifacts.
 * @evidence contracts/common.md#clear-and-simple-design Owns settings' empty-result policy separately from standalone design carrier checks and domain validation; the collector already establishes source/export ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No settings export receives a payload exception; semantic records must remain under their design owner, and prior diagnostics do not change this contribution's length-based verdict.
 * @evidence contracts/common.md#meaningful-documentation States normalized-input premise, settings lineage meaning, nonempty refusal and diagnostic mutation; a true result proves only this zero-payload condition.
 * @evidence contracts/performance.md#efficient-algorithms Reads three array lengths and optionally appends one diagnostic, taking constant time and space without traversing or cloning contributions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Three mutable array-length reads are the entire computation; retaining verdicts would need fresh length equivalence and add state without removing substantial work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's attempt owns any appended diagnostic and contribution arrays; this synchronous gate retains nothing and acquires no handle or task.
 */
export function admitAutoMovieLibrarySettingsContribution(props: {
  diagnostics: IAutoMovieDiagnostic[];
  registration: ICompiledLibraryOwnerRegistration;
  source: string;
  target: string;
}): boolean {
  const contribution: ICompiledLibraryOwnerRegistration["contribution"] = props.registration.contribution;
  const populations: number =
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
}
