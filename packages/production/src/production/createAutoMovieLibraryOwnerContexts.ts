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
 * @evidence contracts/common.md#principled-implementation Exact path/anchor owner addresses bind source registration to graph-admitted design units and settings deliveries; contexts share the already verified derived closure from the same attempt.
 * @evidence contracts/common.md#clear-and-simple-design compileAutoMovieLibrary constructs these two indexes once before linking source registrations; context lookup and source-branch binding remain separate outputs of one owner population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This stage relies on evidence-graph duplicate-address and path/anchor admission, not insertion order as an alternative validator; it executes no author module or stale derivation repair.
 * @evidence contracts/common.md#meaningful-documentation States admitted-input premise, design-before-settings ordering, exact addresses and shared verified artifacts.
 * @evidence contracts/performance.md#efficient-algorithms For U design units and E execution entries, construction visits O(U+E) entries plus address-text cost and retains two maps of distinct addresses; verified artifact data is referenced rather than copied into each context.
 * @evidence contracts/performance.md#reuse-equivalent-work All owner contexts reuse the same admitted derived-artifact object for this evaluation attempt; no cross-attempt cache or unproved artifact equivalence is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and small context objects transfer to the compile attempt and are bounded by admitted addresses; shared artifact references last with that attempt and no handle or task is acquired.
 */
export function createAutoMovieLibraryOwnerContexts(props: {
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
} {
  const contexts: Map<string, IAutoMovieLibraryBuildContext> = new Map<string, IAutoMovieLibraryBuildContext>();
  const sourceBranches: Map<string, string> = new Map<string, string>();
  for (const owner of props.owners)
    for (const unit of owner.units) {
      const address: string = `${owner.path}#${unit.anchor}`;
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
      const separator: number = entry.owner.lastIndexOf("#");
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
}
