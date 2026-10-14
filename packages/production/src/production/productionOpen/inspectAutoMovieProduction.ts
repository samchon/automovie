import { type IAutoMovieGeneratedFile, type IAutoMovieShotContract, type IAutoMovieTreatmentSequence, type IAutoMovieProductionRenderStatus, type IAutoMovieCaptionReadabilityReport, IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic, IAutoMovieProductionInspection, IAutoMovieProductionNextAction } from "@automovie/interface";
import type { IAutoMovieProductionServices } from "../IAutoMovieProductionServices";

import path from "node:path";
import { AutoMovieProductionProject } from "../AutoMovieProductionProject";
import { compareCodeUnits } from "../contentIdentity";
import { readAutoMovieFilmTimeline } from "../filmTimeline";
import { inspectAutoMovieCaptionReadability } from "../inspectAutoMovieCaptionReadability";
import { productionRenderTargetFingerprint } from "../renderIdentity";
import type { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";
import { productionOpenListFiles } from "./productionOpenListFiles";
import { productionOpenDiagnosticNextAction } from "./productionOpenDiagnosticNextAction";
import { productionOpenListNamedFiles } from "./productionOpenListNamedFiles";
import { productionOpenRenderTargetOwned } from "./productionOpenRenderTargetOwned";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "../normalizeAutoMovieProductionProjectSlash";

/**
 * Project current graph, source presence, generated ownership and discovered render status into one report.
 *
 * @evidence contracts/common.md#principled-implementation Reads the graph/source population, generated listing, fresh status and screenplay ids, then examines discovered manifests and current target fingerprints before caption measurement and revision/inventory reporting.
 * @evidence contracts/common.md#clear-and-simple-design One exported status utility composes existing project, source-status, target-fingerprint and caption owners; no maintained application invocation is identified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Any source-read refusal is classified missing, unreadable render targets conservatively remain owned, and sequential observations do not form an atomic snapshot or authorize physical cleanup.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes current input equality from continued target membership and reports caller-owned diagnostics/actions without claiming final-delivery success.
 * @evidence contracts/performance.md#efficient-algorithms Includes source reads, complete generated/render tree walks, fresh status acquisition, per-manifest checks/fingerprints, diagnostic projection and caption/timeline validation; ordering and byte costs grow with all those populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One acquired graph/generated/status population supplies this report. Each qualifying manifest recomputes its target fingerprint and default live content inventory, including repeated targets; no target-level cache or deduplication is implemented here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned report retains copied lists and borrowed diagnostic/manifest target values; tree-walk buffers expire and underlying readers/capture hosts retain resource ownership.
 */
export const inspectAutoMovieProduction: (services: IAutoMovieProductionServices) => IAutoMovieProductionInspection = (services: IAutoMovieProductionServices): IAutoMovieProductionInspection => {
    const graph: IAutoMovieProductionDesignGraph = services.project.graph();
    const bound: string[] = [];
    const missing: string[] = [];
    for (const source of new Set([...graph.shots.values()].map((shot: IAutoMovieShotContract): string => shot.source.module)))
        try {
            services.project.readSource(source);
            bound.push(source);
        }
        catch {
            missing.push(source);
        }
    bound.sort(compareCodeUnits);
    missing.sort(compareCodeUnits);
    const generated: ReturnType<AutoMovieProductionProject["generatedManifest"]> = services.project.generatedManifest();
    const owned: Set<string> = new Set(generated?.files.map((file: IAutoMovieGeneratedFile): string => file.path) ?? []);
    const unownedGenerated: string[] = productionOpenListFiles(services.project.generatedRoot())
        .map((file: string): string => normalizeSlash(path.relative(services.project.generatedRoot(), file)))
        .filter((file: string): boolean => owned.has(file) === false);
    const compilation: IAutoMovieBuildProjectOutput = services.buildStatus();
    const diagnostics: IAutoMovieDiagnostic[] = compilation.diagnostics;
    const sequenceIds: Set<string> = new Set((services.project.screenplayIndex()?.treatment.sequences ?? []).map((sequence: IAutoMovieTreatmentSequence): string => sequence.id));
    const renders: IAutoMovieProductionRenderStatus[] = productionOpenListNamedFiles(services.project.renderRoot(), "manifest.json")
        .map((file: string): IAutoMovieProductionRenderStatus => {
        const manifest: ReturnType<AutoMovieProductionProject["verifiedRenderManifest"]> = services.project.verifiedRenderManifest(file);
        return {
            path: normalizeSlash(path.relative(services.project.root, file)),
            current: compilation.success &&
                generated !== null &&
                generated.inputFingerprint === compilation.builder.inputFingerprint &&
                manifest !== null &&
                manifest.targetFingerprint ===
                    productionRenderTargetFingerprint(services.project, generated, manifest.target),
            target: manifest?.target ?? null,
            owned: productionOpenRenderTargetOwned(graph, sequenceIds, manifest?.target ?? null),
        };
    })
        .sort((left: IAutoMovieProductionRenderStatus, right: IAutoMovieProductionRenderStatus): number => compareCodeUnits(left.path, right.path));
    const nextActions: IAutoMovieProductionNextAction[] = [
        ...diagnostics
            .filter((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.category === "error")
            .map(productionOpenDiagnosticNextAction),
    ];
    const captionReadability: IAutoMovieCaptionReadabilityReport = compilation.success &&
        graph.production !== null &&
        generated !== null &&
        generated.inputFingerprint === compilation.builder.inputFingerprint
        ? inspectAutoMovieCaptionReadability(readAutoMovieFilmTimeline(services.project, compilation.builder.inputFingerprint), graph.production.captionReadabilityProfiles ?? [])
        : { version: 2 as const, cues: [] };
    return {
        revision: services.project.revision(),
        design: services.project.inventory(),
        source: { bound, missing, unownedGenerated },
        diagnostics,
        renders,
        captionReadability,
        nextActions,
    };
};
