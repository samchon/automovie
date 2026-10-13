import type { IAutoMovieLibraryAuthoringSourceSnapshot } from "./IAutoMovieLibraryAuthoringSourceSnapshot";
import { compareCodeUnits } from "./contentIdentity";
import { isAutoMovieSourceOwnerBindingComplete } from "./isAutoMovieSourceOwnerBindingComplete";
import type { IAutoMovieLibraryAuthoringSnapshot } from "./IAutoMovieLibraryAuthoringSnapshot";
import type { IAutoMovieLibrarySourceExecutionPlan } from "./IAutoMovieLibrarySourceExecutionPlan";
import type { IAutoMovieLibrarySourceExecution } from "./IAutoMovieLibrarySourceExecution";

/**
 * Bind every executable library export to the snapshot bytes it will run.
 *
 * Source-owner edges include design source branches and the separately selected productionSources branch. Each selected edge contributes an admitted named export or a refusal; the compile pipeline separately decides whether its scope executes source, and this planner starts no module.
 *
 * @evidence contracts/common.md#principled-implementation Current source digests, unique branch/path/export edges and enforced completion admit exports; any refusal empties the entry set.
 * @evidence contracts/common.md#clear-and-simple-design Compilation binds graph exports to snapshot bytes before linking/evaluating authored modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts requireCompleted=false relaxes stage completion only; enforcement and digest checks remain, and admission does not certify execution success.
 * @evidence contracts/common.md#meaningful-documentation States all-or-empty entries, borrowed sources, exact owner addresses and the completion switch.
 * @evidence contracts/performance.md#efficient-algorithms Builds a P-source map, scans E bindings and sorts entries in O(E log E) tuple comparisons; storage scales with P+E and explanations.
 * @evidence contracts/performance.md#reuse-equivalent-work Snapshot digests are reused instead of source rereads; each plan belongs to its current acquired attempt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned entries/problems and shared sources belong to the caller; no module, handle or task starts here.
 */
export const createAutoMovieLibrarySourceExecutionPlan: (snapshot: IAutoMovieLibraryAuthoringSnapshot, requireCompleted?: boolean) => IAutoMovieLibrarySourceExecutionPlan = (snapshot: IAutoMovieLibraryAuthoringSnapshot, requireCompleted: boolean = true): IAutoMovieLibrarySourceExecutionPlan => {
    const sourceDigests: Map<string, string | null> = new Map(snapshot.sources.map((source: IAutoMovieLibraryAuthoringSourceSnapshot) : [string, string | null] => [source.path, source.digest]));
    const identities: Set<string> = new Set<string>();
    const entries: IAutoMovieLibrarySourceExecution[] = [];
    const problems: string[] = [];
    for (const binding of snapshot.sourceOwners) {
        const identity: string = JSON.stringify([
            binding.branch,
            binding.sourcePath,
            binding.exportName,
        ]);
        if (identities.has(identity)) {
            problems.push(`Library source owner edge ${identity} is duplicated in the current authoring snapshot.`);
            continue;
        }
        identities.add(identity);
        const digest: string | null = sourceDigests.get(binding.sourcePath) ?? null;
        if (digest === null) {
            problems.push(`Library source "${binding.sourcePath}" is selected by the authoring graph but is missing or unreadable.`);
            continue;
        }
        if (digest !== binding.sourceDigest) {
            problems.push(`Library source "${binding.sourcePath}" changed after its owner edge was resolved (${binding.sourceDigest} -> ${digest}).`);
            continue;
        }
        if (binding.enforced === false ||
            (requireCompleted && !isAutoMovieSourceOwnerBindingComplete(binding))) {
            problems.push(`Library source "${binding.sourcePath}#${binding.exportName}" has no completed enforced owner edge.`);
            continue;
        }
        entries.push({
            branch: binding.branch,
            sourcePath: binding.sourcePath,
            exportName: binding.exportName,
            owner: `${binding.targetPath}#${binding.targetAnchor}`,
            sourceDigest: binding.sourceDigest,
        });
    }
    entries.sort((left: IAutoMovieLibrarySourceExecution, right: IAutoMovieLibrarySourceExecution) : number => compareCodeUnits(JSON.stringify([
        left.branch,
        left.sourcePath,
        left.exportName,
        left.owner,
    ]), JSON.stringify([
        right.branch,
        right.sourcePath,
        right.exportName,
        right.owner,
    ])));
    return {
        entries: problems.length === 0 ? entries : [],
        sources: snapshot.sources,
        problems,
    };
};
