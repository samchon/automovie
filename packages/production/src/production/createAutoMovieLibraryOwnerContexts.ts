import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieLibraryBuildContext } from "@automovie/interface";

import type { IAutoMovieLibrarySourceExecutionPlan } from "./libraryAuthoringSnapshot";

/**
 * Exact owner addresses available to one library source evaluation.
 *
 * The builder supplies the attempt's acquired design population and admitted
 * execution plan. Design owners establish their contexts first; settings
 * deliveries then establish their graph-selected addresses. The source linker
 * reads these maps to resolve a registration and its binding branch. They own
 * no project state and retain the same verified derived-artifact objects that
 * evaluation will consume, so a refused compile cannot borrow stale artifacts.
 *
 * Owner paths and anchors have already been validated by the evidence graph.
 * Duplicate-address admission remains the graph's responsibility; this stage
 * preserves the selected population's order and performs no source execution.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Gives a library source registration the exact acquired design address and its source-binding branch.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Projects evaluation contexts from the acquired owner population and graph-admitted settings exports.
 */
export const createAutoMovieLibraryOwnerContexts = (props: {
  /** Namespace included in every source owner's evaluation context. */
  production: string;

  /** Acquired design owners, with their exact source bindings. */
  owners: IAutoMovieProductionEvidence["designOwners"];

  /** Graph-admitted exports, including zero-payload settings deliveries. */
  execution: IAutoMovieLibrarySourceExecutionPlan;

  /** Verified derivation closure shared by every context in this attempt. */
  derivedArtifacts: IAutoMovieLibraryBuildContext["derivedArtifacts"];
}): {
  contexts: ReadonlyMap<string, IAutoMovieLibraryBuildContext>;
  sourceBranches: ReadonlyMap<string, string>;
} => {
  const contexts = new Map<string, IAutoMovieLibraryBuildContext>();
  const sourceBranches = new Map<string, string>();
  for (const owner of props.owners)
    for (const unit of owner.units) {
      const address = `${owner.path}#${unit.anchor}`;
      contexts.set(address, {
        production: props.production,
        branch: owner.branch,
        design: owner.path,
        anchor: unit.anchor,
        derivedArtifacts: props.derivedArtifacts,
      });
      sourceBranches.set(address, owner.sourceBinding?.branch ?? "");
    }
  for (const entry of props.execution.entries)
    if (entry.branch === "productionSources") {
      const separator = entry.owner.lastIndexOf("#");
      contexts.set(entry.owner, {
        production: props.production,
        branch: entry.branch,
        design: entry.owner.slice(0, separator),
        anchor: entry.owner.slice(separator + 1),
        derivedArtifacts: props.derivedArtifacts,
      });
      sourceBranches.set(entry.owner, entry.branch);
    }
  return { contexts, sourceBranches };
};
