import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieDiagnostic } from "@automovie/interface";

import { compareCodeUnits } from "./contentIdentity";
import type { IAutoMovieLibrarySourceExecutionPlan } from "./libraryAuthoringSnapshot";

/**
 * Report graph-selected library owners that evaluation did not realize.
 *
 * Builder source gates call this after registration admission. A recorded
 * registration remains recorded even if its payload was refused: the payload's
 * own diagnostics explain that failure. Settings exports owe a zero-payload
 * delivery; design decisions owe an export only after their source binding
 * selects a file. Missing realizations warn during source work and block review
 * and final gates. Design-only gates never call this stage.
 *
 * This projection sorts copies of design owners and units, leaves the acquired
 * graph and registration map intact, and creates no artifacts or project state.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-partial-verification-scope Reports unrealized library owners at the requested source or completion gate without imposing film requirements.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-verification-invariant Attributes missing realization diagnostics to exact selected library owners and distinguishes work-in-progress warnings from completion errors.
 */
export const inspectAutoMovieLibraryMissingRegistrations = (props: {
  /** Exact design owner population acquired for this attempt. */
  owners: IAutoMovieProductionEvidence["designOwners"];

  /** Admitted source exports evaluated for this attempt. */
  execution: IAutoMovieLibrarySourceExecutionPlan;

  /** First source export recorded for each exact design address. */
  registeredBy: ReadonlyMap<string, string>;

  /** Whether this gate requires every selected decision to be realized. */
  requireReviewed: boolean;
}): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  for (const entry of props.execution.entries)
    if (
      entry.branch === "productionSources" &&
      props.registeredBy.has(entry.owner) === false
    )
      diagnostics.push({
        code: "source-export-missing",
        category: props.requireReviewed ? "error" : "warning",
        phase: "source",
        target: `library:productionSources:${entry.owner}`,
        path: entry.sourcePath,
        message: `Production source "${entry.sourcePath}#${entry.exportName}" did not register its exact settings owner "${entry.owner}" as a zero-payload library delivery. Export one synchronous IAutoMovieLibrarySourceOwner for that address.`,
      });
  for (const owner of [...props.owners].sort((left, right) =>
    compareCodeUnits(left.path, right.path),
  )) {
    const binding = owner.sourceBinding;
    if (binding === null || binding.paths.length === 0) continue;
    for (const unit of [...owner.units].sort((left, right) =>
      compareCodeUnits(left.anchor, right.anchor),
    )) {
      const address = `${owner.path}#${unit.anchor}`;
      if (props.registeredBy.has(address)) continue;
      diagnostics.push({
        code: "source-export-missing",
        category: props.requireReviewed ? "error" : "warning",
        phase: "source",
        target: `library:${owner.branch}:${address}`,
        path: owner.path,
        message: `No source export in the ${binding.branch} population registers library design owner "${address}". Export one owner whose \`design\` names that exact document and anchor, so this reviewed decision has a compiled artifact behind it.`,
      });
    }
  }
  return diagnostics;
};
