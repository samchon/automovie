import { IAutoMovieProductionRepaintCandidate } from "./IAutoMovieProductionRepaintCandidate";
import { IAutoMovieProductionRepaintServiceView } from "./IAutoMovieProductionRepaintServiceView";
import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { IAutoMovieRepaintExecutionResult } from "./IAutoMovieRepaintExecutionResult";
import { assertAutoMovieRepaintExecutionPolicy } from "./assertAutoMovieRepaintExecutionPolicy";
import { executeAutoMovieRepaintRequest } from "./executeAutoMovieRepaintRequest";
import path from "node:path";
import { productionRepaintServiceAssertRepaintEvidence } from "./productionRepaintServiceAssertRepaintEvidence";
import { productionRepaintServiceCurrentShotSource } from "./productionRepaintServiceCurrentShotSource";
import { productionRepaintServiceDiagnostic } from "./productionRepaintServiceDiagnostic";
import { productionRepaintServiceGenerate } from "./productionRepaintServiceGenerate";
import { productionRepaintServiceInputCurrent } from "./productionRepaintServiceInputCurrent";
import { productionRepaintServiceInvalidControls } from "./productionRepaintServiceInvalidControls";
import { productionRepaintServiceLEGACY_REPAINT_POLICY } from "./productionRepaintServiceLEGACY_REPAINT_POLICY";
import { productionRepaintServiceLegacyRepaintEvidence } from "./productionRepaintServiceLegacyRepaintEvidence";
import { productionRepaintServicePublish } from "./productionRepaintServicePublish";
import { productionRepaintServiceRepaintClaimRefusalMessage } from "./productionRepaintServiceRepaintClaimRefusalMessage";
import { productionRepaintServiceRepaintRuntimeInstant } from "./productionRepaintServiceRepaintRuntimeInstant";
import { productionRepaintServiceResolveReferences } from "./productionRepaintServiceResolveReferences";
import { productionRepaintServiceResume } from "./productionRepaintServiceResume";
import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { productionRepaintServiceSafeRepaintInputText } from "./productionRepaintServiceSafeRepaintInputText";
import { productionRepaintServiceValidatedRepaintRequest } from "./productionRepaintServiceValidatedRepaintRequest";
import { productionRepaintServiceWaitForRepaintBackoff } from "./productionRepaintServiceWaitForRepaintBackoff";
import { AutoMovieDiagnosticCode, AutoMovieRepaintReferenceRole, IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic, IAutoMoviePreviewFrameOutput, IAutoMovieProductionDesign, IAutoMovieProductionFrameRate, IAutoMovieRenderBundleManifest, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorAdoption, IAutoMovieRepaintRequestEvidence, IAutoMovieRepaintShot, IAutoMovieShotContract } from "@automovie/interface";
import { AutoMovieRepaintClaimAdmission, IAutoMovieRepaintAttemptClaim } from "./repaintAttemptClaim";
import { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { canonicalAutoMovieJsonBytes, canonicalizeAutoMovieJson, digestAutoMovieBytes } from "./contentIdentity";
import { canonicalAutoMovieRepaintGeneratorAdoption, canonicalAutoMovieRepaintRuntimeIdentity, productionRepaintRequestFingerprint, productionSourceRenderFingerprint } from "./renditionIdentity";
import { randomUUID } from "node:crypto";
import { readAutoMovieProductionRegistry } from "./productionRegistry";
import { resolveProductionFrameRate } from "@automovie/engine";

/**
 * Preserves request/generator/build/registry/source/reference validation, exact retry resumption, cost/time/backoff envelope, claim admission, immutable observer settlement and final candidate publication in the original sequence.
 *
 * @evidence contracts/common.md#principled-implementation Preserves request/generator/build/registry/source/reference validation, exact retry resumption, cost/time/backoff envelope, claim admission, immutable observer settlement and final candidate publication in the original sequence.
 * @evidence contracts/common.md#clear-and-simple-design The operation owns ordered orchestration and mutable request-ID/claim state; source capture's original await and immutable observer settlement stay in this coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy one-attempt policy/evidence are explicit compatibility defaults; currentness, provider provenance and immutable claim/attempt effects are never replaced by matching document prose or fixture answers.
 * @evidence contracts/common.md#meaningful-documentation Snapshots/views/closures survive its Promise; source capture or injected callbacks may remain pending without a wall-clock bound. Execution owns eventual timer/relay cleanup, project owns claims/journals and providers may outlive a completed refusal.
 * @evidence contracts/performance.md#efficient-algorithms Stage helpers reuse admitted local identities without caching currentness; work follows frame/reference/provider/raw bytes and attempt history, with no new cap or policy introduced.
 * @evidence contracts/performance.md#reuse-equivalent-work Preserves request/generator/build/registry/source/reference validation, exact retry resumption, cost/time/backoff envelope, claim admission, immutable observer settlement and final candidate publication in the original sequence. Stage helpers reuse admitted local identities without caching currentness; work follows frame/reference/provider/raw bytes and attempt history, with no new cap or policy introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Snapshots/views/closures survive its Promise; source capture or injected callbacks may remain pending without a wall-clock bound. Execution owns eventual timer/relay cleanup, project owns claims/journals and providers may outlive a completed refusal.
 */
export async function productionRepaintServiceRepaint(state: IAutoMovieProductionRepaintServiceView, services: IAutoMovieProductionServices, input: IAutoMovieRepaintShot.IProps): Promise<IAutoMovieRepaintShot> {
    const requestedShot: string = productionRepaintServiceSafeRepaintInputText(input, "shot");
    let currentRequestId: string | null = null;
    const failure: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieRepaintShot = (
      code: AutoMovieDiagnosticCode,
      message: string,
    ): IAutoMovieRepaintShot => ({
      repainted: false,
      selected: false,
      requestId: currentRequestId,
      productionId: services.project.productionId,
      shot: requestedShot,
      receipt: null,
      diagnostics: [productionRepaintServiceDiagnostic(code, requestedShot, message)],
    });
    const validatedInput: IAutoMovieRepaintShot.IProps | null = productionRepaintServiceValidatedRepaintRequest(input);
    if (validatedInput === null)
      return failure(
        "repaint-input-invalid",
        "Repaint input must match its exact public request schema before provider execution; remove missing, mistyped, credential-bearing, or hidden fields.",
      );
    input = validatedInput;
    if (state.adapter === undefined || state.generator === undefined)
      return failure(
        "repaint-host-unavailable",
        "This project supplies no complete repaint host. Pass both an adapter implementing AutoMovieProductionShotRepaint and its reviewed generator adoption, then retry. AutoMovie will not fabricate diffusion output or infer provider provenance.",
      );
    if (input.productionId !== services.project.productionId)
      return failure(
        "repaint-production-invalid",
        `Repaint request productionId "${input.productionId}" does not match project "${services.project.productionId}".`,
      );
    let generator: IAutoMovieRepaintGeneratorAdoption;
    let selectedAdapterIdentity: string;
    try {
      generator = structuredClone(state.generator);
      canonicalAutoMovieRepaintGeneratorAdoption(generator);
      selectedAdapterIdentity = canonicalAutoMovieRepaintRuntimeIdentity(
        generator.runtimeIdentity,
      );
    } catch (error) {
      return failure(
        "repaint-host-unavailable",
        `${productionRepaintServiceSafeRepaintDiagnosticMessage(error, "Repaint generator adoption could not be inspected safely.")} Correct the reviewed repaint generator adoption before external execution.`,
      );
    }
    const status: IAutoMovieBuildProjectOutput = services.buildStatus();
    if (status.success === false)
      return failure(
        "repaint-compile-stale",
        "Repaint requires a current successful source compile. Run the scaffold compile command, resolve its diagnostics, and retry.",
      );
    let registry: ReturnType<typeof readAutoMovieProductionRegistry>;
    try {
      registry = readAutoMovieProductionRegistry(services.project);
    } catch (error) {
      return failure(
        "repaint-registry-unavailable",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint builder registry could not be read safely.",
        ),
      );
    }
    if (registry.shots.some((shot: { id: string; path: string; }): boolean => shot.id === requestedShot) === false)
      return failure(
        "repaint-target-missing",
        `Shot "${requestedShot}" is absent from the current builder registry. Correct the registration or compile the source that defines it.`,
      );
    const graph: IAutoMovieProductionDesignGraph = services.project.graph();
    const production: IAutoMovieProductionDesign | null = graph.production;
    const shot: IAutoMovieShotContract | undefined = graph.shots.get(requestedShot);
    if (production === null || shot === undefined)
      return failure(
        "repaint-target-missing",
        `Shot "${requestedShot}" has no current production frame contract. Correct the tracked design and compile before repaint.`,
      );
    const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(production.frameFormat);
    const expectedOutput: { width: number; height: number; fps: number; frameRate: IAutoMovieProductionFrameRate; frameCount: number; runtimeSeconds: number; } = {
      width: production.frameFormat.width,
      height: production.frameFormat.height,
      fps: production.frameFormat.fps,
      frameRate,
      frameCount: Math.round(
        (shot.durationSeconds * frameRate.numerator) / frameRate.denominator,
      ),
      runtimeSeconds: shot.durationSeconds,
    };
    if (
      productionRepaintServiceInvalidControls(input)
    )
      return failure(
        "repaint-input-invalid",
        "Repaint requires trimmed non-blank prompts, a safe-integer seed, strength in [0, 1], scalar controls with trimmed identities, and at least one fixed role-specific reference.",
      );
    const request: IAutoMovieRepaintShot.IProps = {
      ...input,
      shot: requestedShot,
      parameters: structuredClone(input.parameters),
      references: structuredClone(input.references),
    };
    const requestId: string = state.execution?.requestId ?? randomUUID();
    const now: () => Date = state.execution?.now ?? ((): Date => new Date());
    let preflightAt: Date;
    let executionPolicy: IAutoMovieRepaintExecutionPolicy;
    let evidence: IAutoMovieRepaintRequestEvidence;
    try {
      executionPolicy = structuredClone(
        state.execution?.policy ?? productionRepaintServiceLEGACY_REPAINT_POLICY,
      );
      evidence = structuredClone(
        state.execution?.evidence ?? productionRepaintServiceLegacyRepaintEvidence(requestedShot),
      );
      preflightAt = productionRepaintServiceRepaintRuntimeInstant(now(), "preflight");
      assertAutoMovieRepaintExecutionPolicy(executionPolicy);
      productionRepaintServiceAssertRepaintEvidence(evidence);
    } catch (error) {
      return failure(
        "repaint-host-unavailable",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint generator provenance could not be inspected safely.",
        ),
      );
    }
    let resolvedSource: IAutoMovieProductionRepaintShotSource | null;
    try {
      const currentCapture: IAutoMoviePreviewFrameOutput = await services.oracle.preview({
        target: { kind: "shot", id: requestedShot },
        time: 0,
        pass: "beauty",
        width: expectedOutput.width,
        height: expectedOutput.height,
      });
      if (
        currentCapture.captured === false ||
        currentCapture.renderBundle === null
      )
        return failure(
          "repaint-source-evidence-missing",
          `The current dialogue and capture runtime could not produce a verified source frame: ${currentCapture.diagnostics
            .map((productionRepaintServiceDiagnostic: IAutoMovieDiagnostic): string => productionRepaintServiceDiagnostic.message)
            .join("; ")}`,
        );
      const currentManifest: IAutoMovieRenderBundleManifest | null = services.project.verifiedRenderManifest(
        path.join(
          services.project.root,
          currentCapture.renderBundle,
          "manifest.json",
        ),
      );
      if (currentManifest === null)
        return failure(
          "repaint-source-evidence-invalid",
          "The current dialogue and capture runtime produced no verifiable render manifest. Discard that capture and retry before repaint.",
        );
      resolvedSource = productionRepaintServiceCurrentShotSource(
        services,
        requestedShot,
        registry.inputFingerprint,
        expectedOutput,
        {
          dialogueRuntimeIdentity: currentManifest.dialogueRuntimeIdentity,
          rendererIdentity: currentManifest.rendererIdentity,
        },
      );
    } catch (error) {
      return failure(
        "repaint-source-evidence-invalid",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint source evidence could not be inspected safely.",
        ),
      );
    }
    if (resolvedSource === null)
      return failure(
        "repaint-source-evidence-missing",
        "No current verified shot bundle contains both beauty pixels and a structural control pass. Capture the shot frame grid and its declared depth, pose, outline, mask, or normal controls first.",
      );
    const source: IAutoMovieProductionRepaintShotSource = resolvedSource;
    const references: { values: Array<{ role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }>; } | { diagnostic: IAutoMovieDiagnostic; } = productionRepaintServiceResolveReferences(services, request);
    if ("diagnostic" in references)
      return failure(references.diagnostic.code, references.diagnostic.message);
    const sourceRenderFingerprint: string = productionSourceRenderFingerprint({
      manifest: source.manifest,
      frames: source.frames,
    });
    const registryIdentity: string = canonicalizeAutoMovieJson(registry);
    const referenceIdentity: string = canonicalizeAutoMovieJson(
      references.values.map(({ role, path: referencePath, digest }: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }): { role: AutoMovieRepaintReferenceRole; path: string; digest: string; } => ({
        role,
        path: referencePath,
        digest,
      })),
    );
    const inputCurrent: () => boolean = (): boolean => { return productionRepaintServiceInputCurrent(services, registry, source, request, registryIdentity, sourceRenderFingerprint, referenceIdentity); };
    const referenceReceipts: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; }[] = references.values.map(
      ({ role, path: referencePath, digest }: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; bytes: Uint8Array; }): { role: AutoMovieRepaintReferenceRole; path: string; digest: string; } => ({
        role,
        path: referencePath,
        digest,
      }),
    );
    const requestFingerprint: string = productionRepaintRequestFingerprint({
      shot: requestedShot,
      compileFingerprint: registry.inputFingerprint,
      sourceRenderFingerprint,
      adapterIdentity: selectedAdapterIdentity,
      generatorProvenance: generator.generatorProvenance,
      parameters: request.parameters,
      executionPolicy,
      evidence,
      references: referenceReceipts,
    });
    let priorAttempts: IAutoMovieRepaintAttemptRecord[];
    try {
      priorAttempts = state.execution?.requestId
        ? services.project.repaintRequestAttempts(requestId)
        : [];
    } catch (error) {
      return failure(
        "repaint-input-invalid",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Stored repaint attempt history could not be inspected safely.",
        ),
      );
    }
    if (priorAttempts.length !== 0) currentRequestId = requestId;
    if (
      state.execution?.requestId !== undefined &&
      (priorAttempts.length === 0 ||
        priorAttempts.some(
          (attempt: IAutoMovieRepaintAttemptRecord): boolean => attempt.requestFingerprint !== requestFingerprint,
        ))
    )
      return failure(
        "repaint-input-invalid",
        "Explicit retry requires an existing request whose source, generator, controls, references, evidence, and execution policy are still exact.",
      );
    if (state.execution?.requestId !== undefined) {
const resumed: IAutoMovieRepaintShot | null = productionRepaintServiceResume(priorAttempts, services, requestedShot, expectedOutput, sourceRenderFingerprint, generator, request, executionPolicy, evidence, referenceReceipts, registry, requestId, source, inputCurrent, failure);
if (resumed !== null) return resumed;
}
    const spent: number = priorAttempts.reduce(
      (sum: number, attempt: IAutoMovieRepaintAttemptRecord): number => sum + attempt.costUnits,
      0,
    );
    let resumeAt: Date;
    try {
      resumeAt = productionRepaintServiceRepaintRuntimeInstant(now(), "execution resume");
    } catch (error) {
      return failure(
        "repaint-host-unavailable",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint execution resume clock could not be inspected safely.",
        ),
      );
    }
    if (
      resumeAt.getTime() < preflightAt.getTime() ||
      (priorAttempts.length !== 0 &&
        resumeAt.getTime() <
          new Date(priorAttempts.at(-1)!.completedAt).getTime())
    )
      return failure(
        "repaint-input-invalid",
        "Repaint execution requires a monotonic runtime clock at or after preflight and the latest immutable terminal attempt.",
      );
    let executionStartedAt: Date;
    try {
      executionStartedAt = productionRepaintServiceRepaintRuntimeInstant(now(), "execution start");
    } catch (error) {
      return failure(
        "repaint-failed",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint execution start clock could not be inspected safely.",
        ),
      );
    }
    if (executionStartedAt.getTime() < resumeAt.getTime())
      return failure(
        "repaint-failed",
        "Repaint execution clock precedes its post-preflight resume observation.",
      );
    const elapsed: number =
      priorAttempts.length === 0
        ? 0
        : executionStartedAt.getTime() -
          new Date(priorAttempts[0]!.startedAt).getTime();
    const remainingAttempts: number =
      executionPolicy.maximumAttempts - priorAttempts.length;
    const remainingElapsed: number = executionPolicy.maximumElapsedMs - elapsed;
    const remainingCost: number = executionPolicy.maximumCostUnits - spent;
    if (remainingAttempts <= 0 || remainingElapsed <= 0 || remainingCost <= 0)
      return failure(
        "repaint-failed",
        "The repaint request exhausted its declared attempt, elapsed-time, or cost budget. Reroll only by creating a new request identity.",
      );
    if (priorAttempts.length !== 0) {
      const latest: IAutoMovieRepaintAttemptRecord = priorAttempts.at(-1)!;
      const retryBackoff: number = Math.min(
        ...executionPolicy.backoffMs.slice(
          priorAttempts.length - 1,
          priorAttempts.length,
        ),
      );
      const retryNotBefore: number =
        new Date(latest.completedAt).getTime() + retryBackoff;
      if (executionStartedAt.getTime() < retryNotBefore)
        return failure(
          "repaint-failed",
          "Explicit retry cannot start before the unchanged execution policy's deterministic backoff has fully elapsed.",
        );
    }
    const remainingPolicy: IAutoMovieRepaintExecutionPolicy = {
      ...executionPolicy,
      maximumAttempts: remainingAttempts,
      maximumElapsedMs: remainingElapsed,
      maximumCostUnits: remainingCost,
      attemptTimeoutMs: Math.min(
        executionPolicy.attemptTimeoutMs,
        remainingElapsed,
      ),
      backoffMs: executionPolicy.backoffMs.slice(
        priorAttempts.length,
        priorAttempts.length + remainingAttempts - 1,
      ),
    };
    let executionClockFloor: number = executionStartedAt.getTime();
    let firstExecutionObservation: boolean = true;
    const executionNow: () => Date = (): Date => {
      if (firstExecutionObservation) {
        firstExecutionObservation = false;
        return new Date(executionStartedAt.getTime());
      }
      const observed: Date = productionRepaintServiceRepaintRuntimeInstant(now(), "execution");
      if (observed.getTime() < executionClockFloor)
        throw new Error(
          "Repaint execution clock precedes its post-preflight resume observation.",
        );
      executionClockFloor = observed.getTime();
      return observed;
    };
    let execution: IAutoMovieRepaintExecutionResult<IAutoMovieProductionRepaintCandidate>;
    const claims: Map<string, IAutoMovieRepaintAttemptClaim> = new Map<string, IAutoMovieRepaintAttemptClaim>();
    try {
      execution = await executeAutoMovieRepaintRequest({
        productionId: services.project.productionId,
        shot: requestedShot,
        requestId,
        ordinalOffset: priorAttempts.length,
        requestFingerprint,
        compileFingerprint: registry.inputFingerprint,
        sourceRenderFingerprint,
        adapterIdentity: selectedAdapterIdentity,
        seed: request.parameters.seed,
        policy: remainingPolicy,
        signal: state.execution?.signal,
        runtime: {
          now: executionNow,
          attemptId: randomUUID,
          wait: productionRepaintServiceWaitForRepaintBackoff,
        },
        admitAttempt: (attemptId: string, ordinal: number): AutoMovieRepaintClaimAdmission => {
          const prefix: IAutoMovieRepaintAttemptRecord[] = services.project.repaintRequestAttempts(requestId);
          const claim: IAutoMovieRepaintAttemptClaim = {
            version: 1,
            productionId: services.project.productionId,
            shot: requestedShot,
            requestId,
            requestFingerprint,
            attemptOrdinal: ordinal,
            attemptId,
            prefixDigest: digestAutoMovieBytes(
              canonicalAutoMovieJsonBytes(prefix),
            ),
            generation: ordinal,
            claimedAt: executionNow().toISOString(),
          };
          const admission: AutoMovieRepaintClaimAdmission = services.project.acquireRepaintAttemptClaim(claim);
          if (admission.status === "acquired") claims.set(attemptId, claim);
          return admission;
        },
        execute: (signal: AbortSignal, attemptId: string): Promise<{ value: IAutoMovieProductionRepaintCandidate; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; }> => productionRepaintServiceGenerate(state, services, registry, requestedShot, source, sourceRenderFingerprint, references, request, requestId, now, inputCurrent, selectedAdapterIdentity, expectedOutput, remainingPolicy, signal, attemptId),
        onAttempt: (attempt: IAutoMovieRepaintAttemptRecord, observation: { externalOutcome: "settled" | "unknown"; }): void => {
          services.project.commitRepaintAttempt(attempt);
          // Execution admits an attempt only through the claim recorded above,
          // so every terminal attempt it reports carries its own claim.
          services.project.settleRepaintAttemptClaim(
            claims.get(attempt.attemptId)!,
            observation.externalOutcome === "unknown"
              ? "unknown-outcome"
              : attempt.status === "succeeded"
                ? "fulfilled"
                : "rejected",
          );
          currentRequestId = requestId;
        },
      });
    } catch (error) {
      return failure(
        "repaint-failed",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint execution failed without a safe diagnostic.",
        ),
      );
    }
    if (execution.stop === "observer-failed")
      return failure(
        "repaint-commit-refused",
        // An observer can fail only while notifying a pushed terminal attempt.
        `Repaint terminal attempt "${execution.attempts.at(-1)!.attemptId}" could not be committed; no retry or candidate publication was started.`,
      );
    if (execution.stop === "claim-refused")
      return failure(
        "repaint-claim-refused",
        // A claim-refused stop always carries the admission that refused it.
        productionRepaintServiceRepaintClaimRefusalMessage(requestId, execution.claimRefusal!),
      );
    if (execution.accepted === null)
      return failure(
        execution.attempts.at(-1)?.status === "stale"
          ? "repaint-input-changed"
          : execution.attempts.at(-1)?.status === "invalid"
            ? "repaint-output-invalid"
            : "repaint-failed",
        `Repaint request stopped as ${execution.stop}; every terminal attempt was preserved and no candidate was selected.`,
      );
    return productionRepaintServicePublish(execution, requestedShot, sourceRenderFingerprint, generator, request, executionPolicy, evidence, referenceReceipts, services, registry, requestId, source, inputCurrent, failure);
  }
