import type { IAutoMovieProductionProjectMutationConsequences } from "./IAutoMovieProductionProjectMutationConsequences";


import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { type IAutoMovieDiagnostic, type IAutoMovieGeneratedFile, type IAutoMovieScreenplayIndex, IAutoMovieDesignMutationOutput, IAutoMovieDesignTarget } from "@automovie/interface";
import { IValidation } from "typia";
import { digestAutoMovieBytes } from "./contentIdentity";
import { type IAutoMovieProductionDesignGraph, validateAutoMovieProductionGraph } from "./validateProductionDesign";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectCaseCollidingDesignId } from "./productionProjectCaseCollidingDesignId";
import { productionProjectReplaceDesign } from "./productionProjectReplaceDesign";
import { productionProjectConsequencesOf } from "./productionProjectConsequencesOf";
import { productionProjectMergeMutationConsequences } from "./productionProjectMergeMutationConsequences";
import { productionProjectTargetKey } from "./productionProjectTargetKey";
import { productionProjectDiagnosticIdentity } from "./productionProjectDiagnosticIdentity";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectIsSharedDesign } from "./productionProjectIsSharedDesign";
import { productionProjectLoadGraph } from "./productionProjectLoadGraph";
import { productionProjectLoadGeneratedManifest } from "./productionProjectLoadGeneratedManifest";
import { productionProjectLoadScreenplayIndex } from "./productionProjectLoadScreenplayIndex";
import { productionProjectDesignPath } from "./productionProjectDesignPath";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Admit and publish one design while reporting newly invalidated downstream diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation The supplied validation must describe the same value; schema/case/target graph errors refuse, while newly different downstream errors become warnings so dependent designs can be updated in later mutations.
 * @evidence contracts/common.md#clear-and-simple-design Before/after graphs, diagnostic identity and merged consequences separate staged admission from the single-file transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The serialized value is the original supplied value, not substituted validator data; accepted reporting does not physically apply every stale review/render/generated list.
 * @evidence contracts/common.md#meaningful-documentation Success returns serialized-byte fingerprint and committed revision; refusal preserves state and predictions, while newly invalidated dependents keep compilation blocked.
 * @evidence contracts/performance.md#efficient-algorithms Includes full graph/manifest/screenplay reads, two graph validations and consequence traversals, candidate-map sorting, diagnostic folds, serialization/hashing and guarded file publication.
 * @evidence contracts/performance.md#reuse-equivalent-work The initial graph, screenplay and generated paths are shared within the attempt; current revision/physical namespace are rechecked at commit and no cross-request graph cache is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph and diagnostic temporaries release after the attempt; returned reports transfer to the caller and commitFiles owns lock/staged-byte/temporary lifetime.
 */
export function productionProjectSetDesign(state: AutoMovieProductionProjectState, target: IAutoMovieDesignTarget, value: unknown, validation: IValidation<unknown>): IAutoMovieDesignMutationOutput {
    const expectedRevision: number = state.lastReadRevision_;
    const graph: IAutoMovieProductionDesignGraph = productionProjectLoadGraph(state);
    const generatedPaths: string[] = productionProjectLoadGeneratedManifest(state)?.files.map((file: IAutoMovieGeneratedFile): string => file.path) ?? [];
    const screenplay: IAutoMovieScreenplayIndex | null = productionProjectLoadScreenplayIndex(state);
    const consequences: IAutoMovieProductionProjectMutationConsequences = productionProjectConsequencesOf(graph, target, generatedPaths, screenplay);
    const previousDiagnostics: Set<string> = new Set(validateAutoMovieProductionGraph(graph, state.productionId, state.archetypes).map(productionProjectDiagnosticIdentity));
    if (validation.success === false)
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target,
            fingerprint: null,
            consequences,
            diagnostics: validation.errors.map((error: IValidation.IError): { code: "design-schema-invalid"; category: "error"; phase: "design"; target: string; path: string; message: string; } => ({
                code: "design-schema-invalid",
                category: "error",
                phase: "design",
                target: productionProjectTargetKey(target),
                path: relativeToRoot(state.root, productionProjectDesignPath(state, target)),
                message: `${error.path} expects ${error.expected}. Fix that field in the design setter.`,
            })),
        };
    const collision: { requested: string; existing: string; } | null = productionProjectCaseCollidingDesignId(graph, target);
    if (collision !== null)
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target,
            fingerprint: null,
            consequences,
            diagnostics: [
                {
                    code: "design-id-collision",
                    category: "error",
                    phase: "design",
                    target: productionProjectTargetKey(target),
                    path: relativeToRoot(state.root, productionProjectDesignPath(state, target)),
                    message: `Design id "${collision.requested}" collides with existing id "${collision.existing}" on a case-insensitive filesystem. Choose a portable distinct id before committing.`,
                },
            ],
        };
    const next: IAutoMovieProductionDesignGraph = productionProjectReplaceDesign(graph, target, value);
    const nextConsequences: IAutoMovieProductionProjectMutationConsequences = productionProjectConsequencesOf(next, target, generatedPaths, screenplay);
    const nextDiagnostics: IAutoMovieDiagnostic[] = validateAutoMovieProductionGraph(next, state.productionId, state.archetypes);
    const diagnostics: IAutoMovieDiagnostic[] = nextDiagnostics.filter((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.target === productionProjectTargetKey(target) ||
        (target.kind === "formation" && diagnostic.target === "formations"));
    if (diagnostics.some((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category === "error"))
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target,
            fingerprint: null,
            consequences,
            diagnostics,
        };
    const downstreamDiagnostics: { code: "design-downstream-invalidated"; category: "warning"; message: string; phase: "project" | "design" | "source" | "compile" | "review" | "render"; target: string; path: string | null; }[] = nextDiagnostics
        .filter((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category === "error" &&
        diagnostic.target !== productionProjectTargetKey(target) &&
        previousDiagnostics.has(productionProjectDiagnosticIdentity(diagnostic)) === false)
        .map((diagnostic: IAutoMovieDiagnostic): { code: "design-downstream-invalidated"; category: "warning"; message: string; phase: "project" | "design" | "source" | "compile" | "review" | "render"; target: string; path: string | null; } => ({
        ...diagnostic,
        code: "design-downstream-invalidated" as const,
        category: "warning" as const,
        message: `${diagnostic.message} This staged mutation was accepted so the dependent artifact can be updated next; compilation remains blocked until it is corrected.`,
    }));
    const content: string = productionProjectSerializeJson(value);
    const revision: number = productionProjectCommitFiles(state, [{ path: productionProjectDesignPath(state, target), content }], undefined, expectedRevision, undefined, true, productionProjectIsSharedDesign(target));
    return {
        accepted: true,
        revision,
        target,
        fingerprint: digestAutoMovieBytes(Buffer.from(content, "utf8")),
        consequences: productionProjectMergeMutationConsequences(consequences, nextConsequences, next.production?.visualDelivery !== "deterministic"),
        diagnostics: downstreamDiagnostics,
    };
}
