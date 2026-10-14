import { AutoMovieRepaintAttemptError } from "./AutoMovieRepaintAttemptError";
import { IAutoMovieProductionRepaintCandidate } from "./IAutoMovieProductionRepaintCandidate";
import { IAutoMovieProductionRepaintServiceView } from "./IAutoMovieProductionRepaintServiceView";
import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import path from "node:path";
import { productionRepaintServiceNormalizeSlash } from "./productionRepaintServiceNormalizeSlash";
import { productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES } from "./productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES";
import { productionRepaintServiceRepaintRuntimeInstant } from "./productionRepaintServiceRepaintRuntimeInstant";
import { productionRepaintServiceResolveReferences } from "./productionRepaintServiceResolveReferences";
import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { AutoMovieGuidePass, AutoMovieProductionShotRepaint, IAutoMovieProductionFrameRate, IAutoMovieProductionMediaProbe, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintShot } from "@automovie/interface";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { IAutoMovieRepaintRawOutputPublication } from "./IAutoMovieRepaintRawOutputPublication";
import { assertProductionRenditionClipDelivery, probeProductionVideoMp4 } from "@automovie/render/node";
import { canonicalAutoMovieRepaintRuntimeIdentity } from "./renditionIdentity";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieCaptureRuntimeIdentity } from "./parseAutoMovieCaptureRuntimeIdentity";
import { planAutoMovieRepaintRawOutput, productionRepaintRawOutputReceiptPath } from "./repaintRawOutput";
import { readAutoMovieProductionRegistry } from "./productionRegistry";

/**
 * Invokes the original adapter receiver with fresh source/reference bytes, quarantines available failure bytes, validates provider identity/cost/video/delivery/currentness and returns only an admitted candidate with metered output metadata.
 *
 * @evidence contracts/common.md#principled-implementation Invokes the original adapter receiver with fresh source/reference bytes, quarantines available failure bytes, validates provider identity/cost/video/delivery/currentness and returns only an admitted candidate with metered output metadata.
 * @evidence contracts/common.md#clear-and-simple-design The asynchronous stage owns the original provider callback body, output admission and raw quarantine; its synchronous callback adapter returns the exact Promise with no added await.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing MP4/provider-identity/delivery/currentness checks and 512MiB raw-retention gate remain; partial bytes are quarantined without calling them an accepted candidate.
 * @evidence contracts/common.md#meaningful-documentation Byte snapshots/copies and probe state can overlap. The 512MiB retention gate occurs after provider allocation and copying/hashing, so it does not bound earlier residency; abort-ignoring providers can retain work and project publication owns durable bytes.
 * @evidence contracts/performance.md#efficient-algorithms Reads/hashes/copies/probes scale with source/reference/output bytes; the existing 512MiB raw-output ceiling remains, while media parsing/probe has its own non-linear box/sample costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Invokes the original adapter receiver with fresh source/reference bytes, quarantines available failure bytes, validates provider identity/cost/video/delivery/currentness and returns only an admitted candidate with metered output metadata. Reads/hashes/copies/probes scale with source/reference/output bytes; the existing 512MiB raw-output ceiling remains, while media parsing/probe has its own non-linear box/sample costs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Byte snapshots/copies and probe state can overlap. The 512MiB retention gate occurs after provider allocation and copying/hashing, so it does not bound earlier residency; abort-ignoring providers can retain work and project publication owns durable bytes.
 */
export async function productionRepaintServiceGenerate(state: IAutoMovieProductionRepaintServiceView, services: IAutoMovieProductionServices, registry: ReturnType<typeof readAutoMovieProductionRegistry>, requestedShot: string, source: IAutoMovieProductionRepaintShotSource, sourceRenderFingerprint: string, references: Extract<ReturnType<typeof productionRepaintServiceResolveReferences>, { values: unknown }>, request: IAutoMovieRepaintShot.IProps, requestId: string, now: () => Date, inputCurrent: () => boolean, selectedAdapterIdentity: string, expectedOutput: { width: number; height: number; fps: number; frameRate: IAutoMovieProductionFrameRate; frameCount: number; runtimeSeconds: number; }, remainingPolicy: IAutoMovieRepaintExecutionPolicy, signal: AbortSignal, attemptId: string): Promise<{ value: IAutoMovieProductionRepaintCandidate; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; }> {

          let generated: Awaited<ReturnType<AutoMovieProductionShotRepaint>>;
          try {
            generated = await state.invokeAdapter({
              signal,
              projectRoot: services.project.root,
              productionId: services.project.productionId,
              compileFingerprint: registry.inputFingerprint,
              shot: requestedShot,
              source: {
                bundle: source.bundle,
                manifest: structuredClone(source.manifest),
                fingerprint: sourceRenderFingerprint,
                frames: source.frames.map((frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): { index: number; time: number; pass: AutoMovieGuidePass; digest: string; bytes: Uint8Array<ArrayBufferLike>; } => ({
                  index: frame.index,
                  time: frame.time,
                  pass: frame.pass,
                  digest: frame.digest,
                  bytes: services.project.readRenderFile(
                    productionRepaintServiceNormalizeSlash(path.join(source.bundle, frame.path)),
                  ),
                })),
                captureRuntime: parseAutoMovieCaptureRuntimeIdentity(
                  source.manifest.rendererIdentity,
                ),
              },
              references: structuredClone(references.values),
              parameters: structuredClone(request.parameters),
            });
          } catch (error) {
            if (
              error instanceof AutoMovieRepaintAttemptError &&
              error.rawOutput !== undefined
            ) {
              const publication: IAutoMovieRepaintRawOutputPublication = planAutoMovieRepaintRawOutput({
                productionId: services.project.productionId,
                shot: requestedShot,
                requestId,
                attemptId,
                bytes: error.rawOutput.bytes,
                mediaType: error.rawOutput.mediaType,
                disposition: signal.aborted ? "cancelled" : "partial",
                retainedAt: productionRepaintServiceRepaintRuntimeInstant(
                  now(),
                  "partial raw output retention",
                ).toISOString(),
                maximumBytes: productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES,
              });
              services.project.commitRepaintRawOutput(publication);
              throw new AutoMovieRepaintAttemptError(
                error.failureClass,
                error.message,
                error.costUnits,
                {
                  digest: publication.receipt.digest,
                  bytes: publication.receipt.bytes,
                  receipt: productionRepaintRawOutputReceiptPath(
                    requestId,
                    attemptId,
                  ),
                },
              );
            }
            throw error;
          }
          let costUnits: number = 0;
          let availableOutput: {
            digest: string;
            bytes: number;
            receipt?: string;
          } | null = null;
          let inputStaleError: AutoMovieRepaintAttemptError | undefined;
          let rawRetained: boolean = false;
          // Every adapter field is read exactly once, inside the classified
          // try: a getter that throws is an invalid output, and the raw
          // retention below reuses the captured values instead of touching the
          // hostile object again from inside a catch handler.
          let reportedMediaType: unknown;
          let reportedBytes: Uint8Array | undefined;
          try {
            const reportedCostUnits: number | undefined = generated.costUnits;
            if (
              reportedCostUnits !== undefined &&
              (Number.isFinite(reportedCostUnits) === false ||
                reportedCostUnits < 0)
            )
              throw new Error(
                "the adapter returned an invalid metered cost disclosure",
              );
            costUnits = reportedCostUnits ?? 0;
            reportedMediaType = generated.mediaType;
            const adapterBytes: Uint8Array<ArrayBufferLike> = generated.bytes;
            if (adapterBytes instanceof Uint8Array === false)
              throw new Error("the adapter did not return Uint8Array bytes");
            const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(adapterBytes);
            reportedBytes = bytes;
            const outputDigest: string | null =
              bytes.length === 0 ? null : digestAutoMovieBytes(bytes);
            availableOutput =
              outputDigest === null
                ? null
                : { digest: outputDigest, bytes: bytes.length };
            const retainRaw: (disposition: "candidate-source" | "invalid" | "cancelled" | "budget-exhausted") => void = (
              disposition:
                | "candidate-source"
                | "invalid"
                | "cancelled"
                | "budget-exhausted",
            ): void => {
              if (outputDigest === null || rawRetained) return;
              const publication: IAutoMovieRepaintRawOutputPublication = planAutoMovieRepaintRawOutput({
                productionId: services.project.productionId,
                shot: requestedShot,
                requestId,
                attemptId,
                bytes,
                mediaType:
                  typeof reportedMediaType === "string"
                    ? reportedMediaType
                    : "application/octet-stream",
                disposition,
                retainedAt: productionRepaintServiceRepaintRuntimeInstant(
                  now(),
                  "raw output retention",
                ).toISOString(),
                maximumBytes: productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES,
              });
              services.project.commitRepaintRawOutput(publication);
              availableOutput = {
                digest: publication.receipt.digest,
                bytes: publication.receipt.bytes,
                receipt: productionRepaintRawOutputReceiptPath(
                  requestId,
                  attemptId,
                ),
              };
              rawRetained = true;
            };
            if (inputCurrent() === false) {
              retainRaw("invalid");
              inputStaleError = new AutoMovieRepaintAttemptError(
                "input-stale",
                "Compiler registry or deterministic source pixels changed while repaint was running.",
                costUnits,
                availableOutput,
              );
              throw inputStaleError;
            }
            if (
              reportedMediaType !== "video/mp4" ||
              bytes.length === 0 ||
              outputDigest === null
            )
              throw new Error(
                "the adapter did not return non-empty video/mp4 bytes",
              );
            const adapterIdentity: string = canonicalAutoMovieRepaintRuntimeIdentity(
              generated.runtimeIdentity,
            );
            if (adapterIdentity !== selectedAdapterIdentity)
              throw new Error(
                "the adapter reported a provider, model, version, or execution boundary different from the reviewed generator adoption",
              );
            const probe: Extract<IAutoMovieProductionMediaProbe, { kind: "video" }> = probeProductionVideoMp4(bytes);
            if (
              probe.kind !== "video" ||
              probe.frameCount !== expectedOutput.frameCount
            )
              throw new Error(
                `the adapter output does not match the exact ${expectedOutput.width}x${expectedOutput.height}, ${expectedOutput.fps}fps, ${expectedOutput.frameCount}-frame shot contract`,
              );
            assertProductionRenditionClipDelivery({
              bytes,
              shot: requestedShot,
              ...expectedOutput,
            });
            retainRaw(
              signal.aborted
                ? "cancelled"
                : costUnits > remainingPolicy.maximumCostUnits
                  ? "budget-exhausted"
                  : "candidate-source",
            );
            return {
              value: {
                bytes,
                adapterIdentity,
                probe,
                outputDigest,
              },
              costUnits,
              availableOutput,
            };
          } catch (error) {
            if (inputStaleError !== undefined && error === inputStaleError)
              throw error;
            if (
              availableOutput !== null &&
              rawRetained === false &&
              reportedBytes !== undefined
            ) {
              const publication: IAutoMovieRepaintRawOutputPublication = planAutoMovieRepaintRawOutput({
                productionId: services.project.productionId,
                shot: requestedShot,
                requestId,
                attemptId,
                bytes: reportedBytes,
                mediaType:
                  typeof reportedMediaType === "string"
                    ? reportedMediaType
                    : "application/octet-stream",
                disposition: signal.aborted ? "cancelled" : "invalid",
                retainedAt: productionRepaintServiceRepaintRuntimeInstant(
                  now(),
                  "raw output retention",
                ).toISOString(),
                maximumBytes: productionRepaintServiceREPAINT_RAW_OUTPUT_MAXIMUM_BYTES,
              });
              services.project.commitRepaintRawOutput(publication);
              availableOutput = {
                digest: publication.receipt.digest,
                bytes: publication.receipt.bytes,
                receipt: productionRepaintRawOutputReceiptPath(
                  requestId,
                  attemptId,
                ),
              };
            }
            throw new AutoMovieRepaintAttemptError(
              "invalid-output",
              productionRepaintServiceSafeRepaintDiagnosticMessage(
                error,
                "Repaint adapter output could not be inspected safely.",
              ),
              costUnits,
              availableOutput,
            );
          }
}
