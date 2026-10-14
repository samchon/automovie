import type { IAutoMovieProductionProjectMutationConsequences } from "./IAutoMovieProductionProjectMutationConsequences";
import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

import { requireAutoMovieProductionProjectNextRevision as requireNextRevision } from "./requireAutoMovieProductionProjectNextRevision";
import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { type IAutoMovieGeneratedFile, IAutoMovieDesignMutationOutput, IAutoMovieDesignTarget } from "@automovie/interface";
import path from "node:path";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectDesignFromGraph } from "./productionProjectDesignFromGraph";
import { productionProjectReferencesTo } from "./productionProjectReferencesTo";
import { productionProjectConsequencesOf } from "./productionProjectConsequencesOf";
import { productionProjectTargetKey } from "./productionProjectTargetKey";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectIsSharedDesign } from "./productionProjectIsSharedDesign";
import { productionProjectLoadGraph } from "./productionProjectLoadGraph";
import { productionProjectLoadGeneratedManifest } from "./productionProjectLoadGeneratedManifest";
import { productionProjectLoadScreenplayIndex } from "./productionProjectLoadScreenplayIndex";
import { productionProjectDesignPath } from "./productionProjectDesignPath";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Erase an unreferenced design and publish its audit record under revision fencing.
 *
 * @evidence contracts/common.md#principled-implementation Nonblank reason, current graph presence and direct reference refusal precede deletion/audit staging; expected revision comes from the handle and shared families request shared coordination.
 * @evidence contracts/common.md#clear-and-simple-design Graph/reference/consequence readers prepare the decision, while commitFiles owns ordered publication and rollback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or referenced targets return structured refusal without design writes; consequence lists are predictions and do not schedule all generated or render removal here.
 * @evidence contracts/common.md#meaningful-documentation Accepted output has a null design fingerprint; reference refusal carries the current canonical fingerprint, and the trimmed reason is stored only in the audit.
 * @evidence contracts/performance.md#efficient-algorithms Includes full graph/manifest/screenplay reads, consequence traversal/sorting, direct reference scans, canonical hashing and the two-file transaction with byte/ancestry checks.
 * @evidence contracts/performance.md#reuse-equivalent-work One graph and consequence report are reused during the attempt; resident revision and namespace guards are reacquired at commit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed graph/report data are local or returned; the transaction owns locks, staged bytes and atomic temporaries, with incomplete rollback reported by its owner.
 */
export function productionProjectEraseDesignArtifact(state: AutoMovieProductionProjectState, target: IAutoMovieDesignTarget, reason: string = "direct project API erase"): IAutoMovieDesignMutationOutput {
    if (reason.trim().length === 0)
        throw new Error("Design erase audit reason must not be blank.");
    const expectedRevision: number = state.lastReadRevision_;
    const graph: IAutoMovieProductionDesignGraph = productionProjectLoadGraph(state);
    const current: unknown = productionProjectDesignFromGraph(graph, target);
    const consequences: IAutoMovieProductionProjectMutationConsequences = productionProjectConsequencesOf(graph, target, productionProjectLoadGeneratedManifest(state)?.files.map((file: IAutoMovieGeneratedFile): string => file.path) ?? [], productionProjectLoadScreenplayIndex(state));
    if (current === null)
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target,
            fingerprint: null,
            consequences,
            diagnostics: [
                {
                    code: "design-missing",
                    category: "error",
                    phase: "design",
                    target: productionProjectTargetKey(target),
                    path: relativeToRoot(state.root, productionProjectDesignPath(state, target)),
                    message: `The addressed design does not exist. Inspect the project and erase a current target.`,
                },
            ],
        };
    const references: string[] = productionProjectReferencesTo(graph, target);
    if (references.length !== 0)
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target,
            fingerprint: digestAutoMovieBytes(canonicalAutoMovieJsonBytes(current)),
            consequences,
            diagnostics: references.map((reference: string): { code: "design-reference-active"; category: "error"; phase: "design"; target: string; path: string; message: string; } => ({
                code: "design-reference-active",
                category: "error" as const,
                phase: "design" as const,
                target: productionProjectTargetKey(target),
                path: relativeToRoot(state.root, productionProjectDesignPath(state, target)),
                message: `${reference} still references this design. Update that artifact before removing the design record.`,
            })),
        };
    const nextRevision: number = requireNextRevision(expectedRevision);
    const revision: number = productionProjectCommitFiles(state, [
        { path: productionProjectDesignPath(state, target), content: null },
        {
            path: path.join(productionProjectIsSharedDesign(target)
                ? path.join(state.automovieRoot, "audit", "shared-design-mutations")
                : path.join(state.productionStateRoot, "audit", "design-mutations"), `${productionProjectIsSharedDesign(target) ? `${state.productionSegment}-` : ""}${String(nextRevision).padStart(12, "0")}-erase.json`),
            content: productionProjectSerializeJson({
                version: 1,
                revision: nextRevision,
                operation: "erase-design",
                target,
                reason: reason.trim(),
                previousFingerprint: digestAutoMovieBytes(canonicalAutoMovieJsonBytes(current)),
            }),
        },
    ], undefined, expectedRevision, undefined, true, productionProjectIsSharedDesign(target));
    return {
        accepted: true,
        revision,
        target,
        fingerprint: null,
        consequences,
        diagnostics: [],
    };
}
