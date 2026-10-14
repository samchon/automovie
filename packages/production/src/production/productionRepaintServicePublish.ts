import { IAutoMovieProductionRepaintCandidate } from "./IAutoMovieProductionRepaintCandidate";
import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { IAutoMovieRepaintExecutionResult } from "./IAutoMovieRepaintExecutionResult";
import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { productionRepaintServiceSafeRepaintInputRaceMessage } from "./productionRepaintServiceSafeRepaintInputRaceMessage";
import { AutoMovieDiagnosticCode, AutoMovieRepaintReferenceRole, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorAdoption, IAutoMovieRepaintReceipt, IAutoMovieRepaintRequestEvidence, IAutoMovieRepaintShot } from "@automovie/interface";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { probeProductionVideoMp4 } from "@automovie/render/node";
import { productionRepaintOutputPath, productionRepaintStructuralControls } from "./renditionIdentity";
import { readAutoMovieProductionRegistry } from "./productionRegistry";

/**
 * Derives the original candidate address/receipt from accepted execution, commits with the same final currentness callback and maps input races versus other commit refusals before returning success.
 *
 * @evidence contracts/common.md#principled-implementation Derives the original candidate address/receipt from accepted execution, commits with the same final currentness callback and maps input races versus other commit refusals before returning success.
 * @evidence contracts/common.md#clear-and-simple-design The synchronous stage owns the original final candidate receipt/commit/return region; the caller retains accepted-result admission and the project owns storage transactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Accepted bytes/probe remain local until synchronous commit returns; the result transfers a receipt/diagnostics while project storage owns resident bytes.
 * @evidence contracts/performance.md#efficient-algorithms Address/digest/receipt serialization scales with metadata and output bytes, while project commit owns staging/currentness/rollback work; no new selection is implied by candidate publication.
 * @evidence contracts/performance.md#reuse-equivalent-work Derives the original candidate address/receipt from accepted execution, commits with the same final currentness callback and maps input races versus other commit refusals before returning success. Address/digest/receipt serialization scales with metadata and output bytes, while project commit owns staging/currentness/rollback work; no new selection is implied by candidate publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted bytes/probe remain local until synchronous commit returns; the result transfers a receipt/diagnostics while project storage owns resident bytes.
 */
export function productionRepaintServicePublish(execution: IAutoMovieRepaintExecutionResult<IAutoMovieProductionRepaintCandidate>, requestedShot: string, sourceRenderFingerprint: string, generator: IAutoMovieRepaintGeneratorAdoption, request: IAutoMovieRepaintShot.IProps, executionPolicy: IAutoMovieRepaintExecutionPolicy, evidence: IAutoMovieRepaintRequestEvidence, referenceReceipts: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; }[], services: IAutoMovieProductionServices, registry: ReturnType<typeof readAutoMovieProductionRegistry>, requestId: string, source: IAutoMovieProductionRepaintShotSource, inputCurrent: () => boolean, failure: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieRepaintShot): IAutoMovieRepaintShot {

    const { bytes, adapterIdentity, probe, outputDigest }: { bytes: Uint8Array; adapterIdentity: string; probe: ReturnType<typeof probeProductionVideoMp4>; outputDigest: string; } = execution.accepted!
      .value as {
      bytes: Uint8Array;
      adapterIdentity: string;
      probe: ReturnType<typeof probeProductionVideoMp4>;
      outputDigest: string;
    };
    const acceptedAttempt: IAutoMovieRepaintAttemptRecord = execution.accepted!.attempt;
    const outputPath: string = productionRepaintOutputPath({
      shot: requestedShot,
      sourceRenderFingerprint,
      attemptId: acceptedAttempt.attemptId,
      adapterIdentity,
      generatorProvenance: generator.generatorProvenance,
      parameters: request.parameters,
      executionPolicy,
      evidence,
      references: referenceReceipts,
      outputDigest,
    });
    const receipt: IAutoMovieRepaintReceipt = {
      version: 4,
      productionId: services.project.productionId,
      shot: requestedShot,
      compileFingerprint: registry.inputFingerprint,
      sourceRenderFingerprint,
      requestId,
      attemptId: acceptedAttempt.attemptId,
      startedAt: acceptedAttempt.startedAt,
      completedAt: acceptedAttempt.completedAt,
      costUnits: acceptedAttempt.costUnits,
      executionPolicy: structuredClone(executionPolicy),
      sourceBundle: source.bundle,
      controls: productionRepaintStructuralControls(source.manifest),
      references: referenceReceipts,
      adapterIdentity,
      generatorProvenance: structuredClone(generator.generatorProvenance),
      structuralAuthority: "deterministic-source-only",
      parameters: structuredClone(request.parameters),
      evidence: structuredClone(evidence),
      output: {
        path: outputPath,
        digest: outputDigest,
        bytes: bytes.length,
        probe,
      },
    };
    try {
      services.project.commitRepaintRendition(receipt, bytes, inputCurrent);
    } catch (error) {
      const inputRaceMessage: string | null = productionRepaintServiceSafeRepaintInputRaceMessage(error);
      if (inputRaceMessage !== null)
        return failure("repaint-input-changed", inputRaceMessage);
      return failure(
        "repaint-commit-refused",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint candidate could not be committed safely.",
        ),
      );
    }
    return {
      repainted: true,
      selected: false,
      requestId,
      productionId: services.project.productionId,
      shot: requestedShot,
      receipt,
      diagnostics: [],
    };
}
