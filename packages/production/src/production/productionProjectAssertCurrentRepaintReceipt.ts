
import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import type { IAutoMovieGeneratedManifest, IAutoMovieProductionDesign, IAutoMovieProductionFrameRate, IAutoMovieProductionVideoProbe, IAutoMovieRenderBundleManifest, IAutoMovieShotContract, IAutoMovieRepaintReceipt, IAutoMovieRepaintRuntimeIdentity } from "@automovie/interface";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { resolveProductionFrameRate } from "@automovie/engine";

import { assertProductionRenditionClipDelivery, probeProductionVideoMp4 } from "@automovie/render/node";
import path from "node:path";
import typia from "typia";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { canonicalizeAutoMovieJson, digestAutoMovieBytes } from "./contentIdentity";
import { canonicalAutoMovieRepaintGeneratorProvenance, canonicalAutoMovieRepaintRuntimeIdentity, productionRepaintOutputPath, productionRepaintRequestFingerprint, productionRepaintStructuralControls, productionSourceRenderFingerprint } from "./renditionIdentity";
import { type IAutoMovieRepaintAttemptRecord, assertAutoMovieRepaintExecutionPolicy } from "./repaintExecution";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectGraph } from "./productionProjectGraph";
import { productionProjectGeneratedManifest } from "./productionProjectGeneratedManifest";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectRepaintRequestAttempts } from "./productionProjectRepaintRequestAttempts";
import { productionProjectAssertRepaintAttemptLedgerPolicy } from "./productionProjectAssertRepaintAttemptLedgerPolicy";
import { productionProjectValidateRepaintReferences } from "./productionProjectValidateRepaintReferences";
import { productionProjectVerifiedRenderManifest } from "./productionProjectVerifiedRenderManifest";

/**
 * Bind supplied rendition bytes and receipt metadata to current compile, source, references, immutable attempts and exact delivery facts.
 *
 * @evidence contracts/common.md#principled-implementation Callers supply schema-admitted receipts; parameter/policy/provenance checks precede current compile/source/control identity, runtime identity, fixed references, exact terminal attempt/policy agreement, canonical output/hash/length and video/shot delivery admission.
 * @evidence contracts/common.md#clear-and-simple-design This validator composes existing graph, manifest, source bundle, reference, attempt and render owners without a new state representation; publication and inspection use the same currentness boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored fingerprints or passing review strings cannot bypass resident source/reference/output reads; media facts and splice delivery are checked separately, with no normalization, profile tolerance or substituted current compile.
 * @evidence contracts/common.md#meaningful-documentation States the schema-admitted input premise and ordered dependency/byte/media refusals; successful return establishes observed currentness only, not a lock-protected publication or future unchanged inputs.
 * @evidence contracts/performance.md#efficient-algorithms Includes source frame/mask verification, content/reference searches and hashes, complete attempt discovery/sort/policy aggregation, canonical identity work and output hashing. The separate video probe and splice validator each parse supplied bytes and sample tables; residency work can include S log(M + 1) for S samples and M media boxes.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted source manifest feeds source identity and controls, and one attempt array feeds terminal matching and policy checks; separately required probe/splice parsing remains explicit rather than claiming one parse or caching mutable currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller receipt/bytes are borrowed; graph/content inputs, attempts, source records and canonical strings may coexist with one parser's copied bytes/sample tables at a time. Actual dependency/file populations bound storage, and no fixed two-times-byte peak or retained parser/handle is claimed.
 */
export function productionProjectAssertCurrentRepaintReceipt(state: AutoMovieProductionProjectState, receipt: IAutoMovieRepaintReceipt, bytes: Uint8Array): void {
    const startedAt: Date = new Date(receipt.startedAt ?? Number.NaN);
    const completedAt: Date = new Date(receipt.completedAt ?? Number.NaN);
    if (receipt.version !== 4 ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(receipt.requestId ?? "") === false ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(receipt.attemptId) === false ||
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(completedAt.getTime()) ||
        startedAt.toISOString() !== receipt.startedAt ||
        completedAt.toISOString() !== receipt.completedAt ||
        completedAt.getTime() < startedAt.getTime() ||
        Number.isFinite(receipt.costUnits) === false ||
        receipt.costUnits! < 0 ||
        receipt.executionPolicy === undefined ||
        receipt.evidence === undefined ||
        Object.entries(receipt.evidence!).some(([key, value]: [string, unknown]): boolean => (key !== "continuity" || value !== null) &&
            (typeof value !== "string" ||
                value.trim().length === 0 ||
                value !== value.trim())) ||
        receipt.parameters.prompt.trim().length === 0 ||
        receipt.parameters.prompt !== receipt.parameters.prompt.trim() ||
        (receipt.parameters.negativePrompt !== undefined &&
            (receipt.parameters.negativePrompt.trim().length === 0 ||
                receipt.parameters.negativePrompt !==
                    receipt.parameters.negativePrompt.trim())) ||
        Number.isSafeInteger(receipt.parameters.seed) === false ||
        Number.isFinite(receipt.parameters.strength) === false ||
        receipt.parameters.strength < 0 ||
        receipt.parameters.strength > 1 ||
        Object.entries(receipt.parameters.controls ?? {}).some(([key, value]: [string, string | number | boolean]): boolean => key.trim().length === 0 ||
            key !== key.trim() ||
            (typeof value === "string" &&
                (value.trim().length === 0 || value !== value.trim())) ||
            (typeof value === "number" && Number.isFinite(value) === false)) ||
        receipt.controls.length === 0)
        throw new Error("Stored repaint receipt parameters are invalid.");
    assertAutoMovieRepaintExecutionPolicy(receipt.executionPolicy!);
    canonicalAutoMovieRepaintGeneratorProvenance(receipt.generatorProvenance);
    const generated: IAutoMovieGeneratedManifest | null = productionProjectGeneratedManifest(state);
    if (generated === null ||
        generated.inputFingerprint !== receipt.compileFingerprint)
        throw new AutoMovieProductionInputRaceError("Repaint receipt does not target the current builder input.");
    const sourceManifest: IAutoMovieRenderBundleManifest | null = productionProjectVerifiedRenderManifest(state, resolveInside(productionProjectRenderRoot(state), path.join(...receipt.sourceBundle.split("/"), "manifest.json")));
    if (sourceManifest === null ||
        sourceManifest.target.kind !== "shot" ||
        sourceManifest.target.id !== receipt.shot ||
        sourceManifest.compileFingerprint !== receipt.compileFingerprint ||
        productionSourceRenderFingerprint({
            manifest: sourceManifest,
            frames: sourceManifest.frames,
        }) !== receipt.sourceRenderFingerprint ||
        canonicalizeAutoMovieJson(productionRepaintStructuralControls(sourceManifest)) !== canonicalizeAutoMovieJson(receipt.controls))
        throw new Error("Stored repaint receipt source evidence is stale.");
    let runtimeIdentity: unknown;
    try {
        runtimeIdentity = JSON.parse(receipt.adapterIdentity);
    }
    catch {
        throw new Error("Stored repaint adapter identity is not JSON.");
    }
    const runtimeValidation: typia.IValidation<IAutoMovieRepaintRuntimeIdentity> = typia.validateEquals<IAutoMovieRepaintRuntimeIdentity>(runtimeIdentity);
    if (runtimeValidation.success === false ||
        canonicalAutoMovieRepaintRuntimeIdentity(runtimeValidation.data) !==
            receipt.adapterIdentity)
        throw new Error("Stored repaint adapter identity is invalid.");
    productionProjectValidateRepaintReferences(state, receipt);
    const requestFingerprint: string = productionRepaintRequestFingerprint({
        shot: receipt.shot,
        compileFingerprint: receipt.compileFingerprint,
        sourceRenderFingerprint: receipt.sourceRenderFingerprint,
        adapterIdentity: receipt.adapterIdentity,
        generatorProvenance: receipt.generatorProvenance,
        parameters: receipt.parameters,
        executionPolicy: receipt.executionPolicy!,
        evidence: receipt.evidence!,
        references: receipt.references,
    });
    const attempts: IAutoMovieRepaintAttemptRecord[] = productionProjectRepaintRequestAttempts(state, receipt.requestId!);
    const firstAttempt: IAutoMovieRepaintAttemptRecord | undefined = attempts.find((candidate: IAutoMovieRepaintAttemptRecord): boolean => candidate.ordinal === 1);
    const attempt: IAutoMovieRepaintAttemptRecord | undefined = attempts.find((candidate: IAutoMovieRepaintAttemptRecord): boolean => candidate.attemptId === receipt.attemptId);
    if (firstAttempt === undefined ||
        attempt === undefined ||
        canonicalizeAutoMovieJson({
            productionId: attempt.productionId,
            shot: attempt.shot,
            requestId: attempt.requestId,
            attemptId: attempt.attemptId,
            requestFingerprint: attempt.requestFingerprint,
            compileFingerprint: attempt.compileFingerprint,
            sourceRenderFingerprint: attempt.sourceRenderFingerprint,
            adapterIdentity: attempt.adapterIdentity,
            seed: attempt.seed,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            status: attempt.status,
            failure: attempt.failure,
            costUnits: attempt.costUnits,
            availableOutput: attempt.availableOutput,
        }) !==
            canonicalizeAutoMovieJson({
                productionId: receipt.productionId,
                shot: receipt.shot,
                requestId: receipt.requestId,
                attemptId: receipt.attemptId,
                requestFingerprint,
                compileFingerprint: receipt.compileFingerprint,
                sourceRenderFingerprint: receipt.sourceRenderFingerprint,
                adapterIdentity: receipt.adapterIdentity,
                seed: receipt.parameters.seed,
                startedAt: receipt.startedAt,
                completedAt: receipt.completedAt,
                status: "succeeded",
                failure: null,
                costUnits: receipt.costUnits,
                availableOutput: {
                    digest: receipt.output.digest,
                    bytes: receipt.output.bytes,
                    ...(attempt.availableOutput?.receipt === undefined
                        ? {}
                        : { receipt: attempt.availableOutput.receipt }),
                },
            }))
        throw new Error("Stored repaint receipt does not match its immutable succeeded terminal attempt.");
    productionProjectAssertRepaintAttemptLedgerPolicy(state, firstAttempt, attempts.slice(1), receipt.executionPolicy!);
    const expected: string = productionRepaintOutputPath({
        shot: receipt.shot,
        sourceRenderFingerprint: receipt.sourceRenderFingerprint,
        attemptId: receipt.attemptId,
        adapterIdentity: receipt.adapterIdentity,
        generatorProvenance: receipt.generatorProvenance,
        parameters: receipt.parameters,
        executionPolicy: receipt.executionPolicy!,
        evidence: receipt.evidence!,
        references: receipt.references,
        outputDigest: receipt.output.digest,
    });
    if (receipt.output.path !== expected ||
        receipt.output.digest !== digestAutoMovieBytes(bytes) ||
        receipt.output.bytes !== bytes.length)
        throw new Error("Stored repaint output identity is invalid.");
    const probe: IAutoMovieProductionVideoProbe = probeProductionVideoMp4(bytes);
    const graph: IAutoMovieProductionDesignGraph = productionProjectGraph(state);
    const production: IAutoMovieProductionDesign | null = graph.production;
    const shot: IAutoMovieShotContract | undefined = graph.shots.get(receipt.shot);
    if (production === null || shot === undefined)
        throw new Error("Stored repaint media target is stale.");
    const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(production.frameFormat);
    const expectedFrameCount: number = Math.round((shot.durationSeconds * frameRate.numerator) / frameRate.denominator);
    if (probe.kind !== "video" ||
        canonicalizeAutoMovieJson(probe) !==
            canonicalizeAutoMovieJson(receipt.output.probe) ||
        probe.frameCount !== expectedFrameCount)
        throw new Error("Stored repaint media facts are stale.");
    assertProductionRenditionClipDelivery({
        bytes,
        shot: receipt.shot,
        width: production.frameFormat.width,
        height: production.frameFormat.height,
        fps: production.frameFormat.fps,
        frameRate,
        frameCount: expectedFrameCount,
        runtimeSeconds: shot.durationSeconds,
    });
}
