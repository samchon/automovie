import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { productionRepaintServiceSafeRepaintInputRaceMessage } from "./productionRepaintServiceSafeRepaintInputRaceMessage";
import { AutoMovieDiagnosticCode, AutoMovieRepaintFailureClass, AutoMovieRepaintReferenceRole, AutoMovieRepaintRetryableFailureClass, IAutoMovieProductionFrameRate, IAutoMovieProductionMediaProbe, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorAdoption, IAutoMovieRepaintReceipt, IAutoMovieRepaintRequestEvidence, IAutoMovieRepaintShot } from "@automovie/interface";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { IAutoMovieRepaintRawOutputPublication } from "./IAutoMovieRepaintRawOutputPublication";
import { assertProductionRenditionClipDelivery, probeProductionVideoMp4 } from "@automovie/render/node";
import { productionRepaintOutputPath, productionRepaintStructuralControls } from "./renditionIdentity";
import { readAutoMovieProductionRegistry } from "./productionRegistry";

/**
 * Reuses an exact successful prior candidate only after raw receipt/byte identity, video/delivery and currentness checks, otherwise applies the original failed-attempt retry eligibility or falls through.
 *
 * @evidence contracts/common.md#principled-implementation Reuses an exact successful prior candidate only after raw receipt/byte identity, video/delivery and currentness checks, otherwise applies the original failed-attempt retry eligibility or falls through.
 * @evidence contracts/common.md#clear-and-simple-design The synchronous stage owns prior-candidate reuse/refusal/fallthrough; the caller retains request-ID state and starts no provider until resumption eligibility is decided.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only exact source/request/policy identity and a verified successful raw revision permit reuse; an ineligible terminal outcome cannot be hidden by retrying it.
 * @evidence contracts/common.md#meaningful-documentation Loaded raw bytes/probe live through synchronous rendition publication or refusal and are not retained in a service-wide cache.
 * @evidence contracts/performance.md#efficient-algorithms Raw byte/probe work scales with saved media, while source/control/evidence checks reuse already admitted request facts; no provider dispatch occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses an exact successful prior candidate only after raw receipt/byte identity, video/delivery and currentness checks, otherwise applies the original failed-attempt retry eligibility or falls through. Raw byte/probe work scales with saved media, while source/control/evidence checks reuse already admitted request facts; no provider dispatch occurs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Loaded raw bytes/probe live through synchronous rendition publication or refusal and are not retained in a service-wide cache.
 */
export function productionRepaintServiceResume(priorAttempts: IAutoMovieRepaintAttemptRecord[], services: IAutoMovieProductionServices, requestedShot: string, expectedOutput: { width: number; height: number; fps: number; frameRate: IAutoMovieProductionFrameRate; frameCount: number; runtimeSeconds: number; }, sourceRenderFingerprint: string, generator: IAutoMovieRepaintGeneratorAdoption, request: IAutoMovieRepaintShot.IProps, executionPolicy: IAutoMovieRepaintExecutionPolicy, evidence: IAutoMovieRepaintRequestEvidence, referenceReceipts: { role: AutoMovieRepaintReferenceRole; path: string; digest: string; }[], registry: ReturnType<typeof readAutoMovieProductionRegistry>, requestId: string, source: IAutoMovieProductionRepaintShotSource, inputCurrent: () => boolean, failure: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieRepaintShot): IAutoMovieRepaintShot | null {

      const latest: IAutoMovieRepaintAttemptRecord = priorAttempts.at(-1)!;
      const latestFailure: { class: AutoMovieRepaintFailureClass; message: string; retryable: boolean; } | null = latest.failure;
      if (
        latest.status === "succeeded" &&
        latest.availableOutput?.receipt !== undefined
      ) {
        try {
          const raw: IAutoMovieRepaintRawOutputPublication = services.project.repaintRawOutput(
            latest.requestId,
            latest.attemptId,
          );
          if (
            raw.receipt.disposition !== "candidate-source" ||
            raw.receipt.digest !== latest.availableOutput.digest ||
            raw.receipt.bytes !== latest.availableOutput.bytes
          )
            throw new Error(
              "Succeeded repaint attempt does not cite a candidate-source raw revision.",
            );
          const probe: Extract<IAutoMovieProductionMediaProbe, { kind: "video" }> = probeProductionVideoMp4(raw.bytes);
          assertProductionRenditionClipDelivery({
            bytes: raw.bytes,
            shot: requestedShot,
            ...expectedOutput,
          });
          const outputPath: string = productionRepaintOutputPath({
            shot: requestedShot,
            sourceRenderFingerprint,
            attemptId: latest.attemptId,
            adapterIdentity: latest.adapterIdentity,
            generatorProvenance: generator.generatorProvenance,
            parameters: request.parameters,
            executionPolicy,
            evidence,
            references: referenceReceipts,
            outputDigest: raw.receipt.digest,
          });
          const receipt: IAutoMovieRepaintReceipt = {
            version: 4,
            productionId: services.project.productionId,
            shot: requestedShot,
            compileFingerprint: registry.inputFingerprint,
            sourceRenderFingerprint,
            requestId,
            attemptId: latest.attemptId,
            startedAt: latest.startedAt,
            completedAt: latest.completedAt,
            costUnits: latest.costUnits,
            executionPolicy: structuredClone(executionPolicy),
            sourceBundle: source.bundle,
            controls: productionRepaintStructuralControls(source.manifest),
            references: referenceReceipts,
            adapterIdentity: latest.adapterIdentity,
            generatorProvenance: structuredClone(generator.generatorProvenance),
            structuralAuthority: "deterministic-source-only",
            parameters: structuredClone(request.parameters),
            evidence: structuredClone(evidence),
            output: {
              path: outputPath,
              digest: raw.receipt.digest,
              bytes: raw.receipt.bytes,
              probe,
            },
          };
          services.project.commitRepaintRendition(
            receipt,
            raw.bytes,
            inputCurrent,
          );
          return {
            repainted: true,
            selected: false,
            requestId,
            productionId: services.project.productionId,
            shot: requestedShot,
            receipt,
            diagnostics: [],
          };
        } catch (error) {
          const inputRaceMessage: string | null = productionRepaintServiceSafeRepaintInputRaceMessage(error);
          if (inputRaceMessage !== null)
            return failure("repaint-input-changed", inputRaceMessage);
          return failure(
            "repaint-commit-refused",
            productionRepaintServiceSafeRepaintDiagnosticMessage(
              error,
              "Repaint candidate could not be resumed from its exact raw revision.",
            ),
          );
        }
      }
      if (
        latest.status !== "failed" ||
        latestFailure === null ||
        latestFailure.retryable !== true ||
        executionPolicy.retryableFailures.some(
          (failureClass: AutoMovieRepaintRetryableFailureClass): boolean => failureClass === latestFailure.class,
        ) === false
      )
        return failure(
          "repaint-input-invalid",
          "Explicit retry requires the latest terminal attempt to be a failed class that the unchanged execution policy marked retryable. A succeeded candidate already met the acceptance stop; use reroll for another candidate.",
        );
return null;
}
