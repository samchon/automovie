import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { productionRenderBundleRelativePath } from "./productionRenderBundleRelativePath";
import { SHA256_DIGEST_PATTERN, renderAutoMovieSemanticMaskSidecar } from "@automovie/engine";
import { AutoMovieProductionFrameCapture, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest, IAutoMovieModel, IAutoMoviePreviewFrameInput, IAutoMoviePreviewFrameOutput, IAutoMovieRenderBundleManifest, IAutoMovieRenderSpec, type IAutoMovieProductionDesign, type IAutoMovieGeneratedFile, type IAutoMovieModelPart, type IAutoMovieDeliveryCrop, type IAutoMovieSemanticMaskEvidence, type IAutoMovieSemanticMaskReceipt } from "@automovie/interface";
import path from "node:path";
import type { PNG } from "pngjs";
import typia from "typia";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "./canonicalAutoMovieCaptureRuntimeIdentity";
import { compareCodeUnits, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { productionRenderTargetFingerprint } from "./renderIdentity";
import { residentPngJs } from "./residentCodecs";
import { classifyAutoMovieProductionSemanticMaskEvidence, createAutoMovieProductionSemanticMaskReceipt, type IAutoMovieProductionSemanticMaskEvidence } from "./semanticMaskEvidence";
import { oracleServiceRetainedBundleFrames } from "./oracleServiceRetainedBundleFrames";
import { oracleServiceNamedParts } from "./oracleServiceNamedParts";
import { oracleServicePreviewFailure } from "./oracleServicePreviewFailure";
import { oracleServiceHasVisiblePixelVariance } from "./oracleServiceHasVisiblePixelVariance";
import { IOracleServiceContext } from "./IOracleServiceContext";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";

/**
 * Capture one requested current frame, validate its PNG/identity metadata, and publish the render bundle.
 *
 * @evidence contracts/common.md#principled-implementation Compile freshness, bounded request/target admission, frame-grid time and opaque host capture precede current-input checks, PNG decoding and guarded bundle commit.
 * @evidence contracts/common.md#clear-and-simple-design The public service supplies late getter reads and original adapter receiver; project owners retain filesystem admission/publication responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pixel variance is not visual correctness; runtime identity is host-supplied metadata, optional buildStatus weakens source freshness, and non-race commit errors propagate.
 * @evidence contracts/common.md#meaningful-documentation Beauty is default; asset angles derive a twelve-second turntable time, shot crop is copied, and the declared H264/CRF17 bundle spec does not encode video here.
 * @evidence contracts/performance.md#efficient-algorithms Includes source-status/graph and target-identity reads, one host capture/decode, two resident manifest verifications, frame/receipt sorting and guarded publication; existing bundle verification reads all resident byte populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Retained target-local frames survive unchanged identities without rewriting, but manifest verification repeats and no capture results are cached across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Context retains the original service during the Promise; captured/decoded/copy buffers and manifests are local, project commit owns locks/staged files, and host page disposal remains outside this operation.
 */
export async function oracleServicePreview(
  context: IOracleServiceContext,
  input: IAutoMoviePreviewFrameInput
): Promise<IAutoMoviePreviewFrameOutput> {
    const generated: IAutoMovieGeneratedManifest | null = context.project.generatedManifest();
    if (generated === null)
      throw new Error(
        "Capture requires a current source compile. Build the current source through the production builder before requesting pixels.",
      );
    const freshness: IAutoMovieDiagnostic | null = context.freshnessDiagnostic(generated);
    if (freshness !== null)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        freshness.code,
        freshness.message,
      );
    const graph: IAutoMovieProductionDesignGraph = context.project.graph();
    const production: IAutoMovieProductionDesign | null = graph.production;
    if (production === null)
      throw new Error(
        "Capture requires a production frame format. Create the tracked production design record and build the current source through the production builder.",
      );
    const pass: NonNullable<IAutoMoviePreviewFrameInput["pass"]> = input.pass ?? "beauty";
    const width: number = input.width ?? production.frameFormat.width;
    const height: number = input.height ?? production.frameFormat.height;
    const fps: number = production.frameFormat.fps;
    if (
      Number.isInteger(width) === false ||
      Number.isInteger(height) === false ||
      width <= 0 ||
      height <= 0 ||
      width > production.frameFormat.width ||
      height > production.frameFormat.height ||
      Number.isFinite(input.time) === false ||
      input.time < 0
    )
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "preview-input-invalid",
        `Capture time must be non-negative; dimensions must be positive integers no larger than the validated ${production.frameFormat.width}x${production.frameFormat.height} production frame. Correct the capture request.`,
      );
    let duration: number | undefined;
    let requestedTime: number = input.time;
    const targetPath: string =
      input.target.kind === "shot"
        ? `shots/${encodeAutoMoviePathSegment(input.target.id)}.json`
        : `models/${encodeAutoMoviePathSegment(input.target.id)}.json`;
    const targetMaterialized: boolean = generated.files.some(
      (file: IAutoMovieGeneratedFile) : boolean => file.path === targetPath,
    );
    if (input.target.kind === "shot")
      duration = graph.shots.get(input.target.id)?.durationSeconds;
    else {
      if (
        graph.models.has(input.target.id) === false ||
        Number.isFinite(input.target.angleDeg) === false ||
        input.target.angleDeg < 0 ||
        input.target.angleDeg >= 360 ||
        Number.isFinite(input.target.elevationDeg) === false ||
        input.target.elevationDeg < -85 ||
        input.target.elevationDeg > 85
      )
        return oracleServicePreviewFailure(
          generated.inputFingerprint,
          "preview-input-invalid",
          "Asset preview requires a current model, angleDeg in [0, 360), and elevationDeg in [-85, 85]. Correct the isolated turntable target.",
        );
      duration = 12;
      requestedTime = input.target.angleDeg / 30;
      if (input.target.pose === "rom-extremes")
        try {
          const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieModel> = typia.validateEquals<IAutoMovieModel>(
            parseAutoMovieStructuredJson({
              record: "compiled-model",
              bytes: context.project.readGeneratedFile(targetPath),
            }),
          );
          if (validation.success === false || validation.data.skeleton === null)
            throw new Error("the compiled model has no humanoid skeleton");
        } catch (error) {
          return oracleServicePreviewFailure(
            generated.inputFingerprint,
            "preview-input-invalid",
            `Asset ROM-extremes capture is unavailable because ${
              error instanceof Error ? error.message : String(error)
            }. Use rest pose for props or compile a valid rig.`,
          );
        }
      const part: string | undefined = input.target.part;
      if (part !== undefined) {
        let model: IAutoMovieModel;
        try {
          const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieModel> = typia.validateEquals<IAutoMovieModel>(
            parseAutoMovieStructuredJson({
              record: "compiled-model",
              bytes: context.project.readGeneratedFile(targetPath),
            }),
          );
          if (validation.success === false)
            throw new Error("the compiled model has an invalid schema");
          model = validation.data;
        } catch (error) {
          return oracleServicePreviewFailure(
            generated.inputFingerprint,
            "preview-input-invalid",
            `Asset part capture is unavailable because ${
              error instanceof Error ? error.message : String(error)
            }. Compile the model before framing one of its parts.`,
          );
        }
        if (model.origin === "imported")
          return oracleServicePreviewFailure(
            generated.inputFingerprint,
            "preview-input-invalid",
            `Compiled model "${input.target.id}" is imported geometry, whose interior nodes this surface does not address. Capture the whole model, or author the piece you need to frame as its own recipe part.`,
          );
        if (model.parts.some((candidate: IAutoMovieModelPart) : boolean => candidate.id === part) === false)
          return oracleServicePreviewFailure(
            generated.inputFingerprint,
            "preview-input-invalid",
            `Compiled model "${input.target.id}" has no part "${part}". Frame one of its current parts: ${oracleServiceNamedParts(model)}.`,
          );
      }
    }
    if (duration === undefined || targetMaterialized === false)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "preview-target-missing",
        `Target "${input.target.kind}:${input.target.id}" is absent from current builder-owned output. Correct the target or compile its source before capturing.`,
      );
    if (requestedTime > duration)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "preview-input-invalid",
        `Preview time ${requestedTime} exceeds target duration ${duration}. Choose a current in-range frame time.`,
      );
    if (context.capture === undefined)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-host-unavailable",
        "This project supplies no project-fixed frame capture. Pass a capture adapter configured for this project's current runtime.",
      );
    const targetFingerprint: string = productionRenderTargetFingerprint(
      context.project,
      generated,
      input.target,
    );
    const index: number = Math.min(
      Math.round(requestedTime * fps),
      Math.floor(duration * fps),
    );
    const time: number = index / fps;
    const crop: IAutoMovieDeliveryCrop | undefined =
      input.target.kind === "shot" ? production.frameFormat.crop : undefined;
    let captured: Awaited<ReturnType<AutoMovieProductionFrameCapture>>;
    try {
      captured = await Reflect.apply(context.capture, context.captureReceiver, [{
        ...input,
        time,
        width,
        height,
        ...(crop === undefined ? {} : { crop: structuredClone(crop) }),
        projectRoot: context.project.root,
        productionId: context.project.productionId,
        compileFingerprint: generated.inputFingerprint,
      } satisfies Parameters<AutoMovieProductionFrameCapture>[0]]);
    } catch (error) {
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-failed",
        `${
          error instanceof Error ? error.message : String(error)
        }. Correct the capture host and retry.`,
      );
    }
    const captureInputsCurrent: () => boolean = (): boolean => {
      const current: IAutoMovieGeneratedManifest | null = context.project.generatedManifest();
      return (
        current !== null &&
        current.inputFingerprint === generated.inputFingerprint &&
        context.freshnessDiagnostic(current) === null &&
        productionRenderTargetFingerprint(
          context.project,
          current,
          input.target,
        ) === targetFingerprint
      );
    };
    if (captureInputsCurrent() === false)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-input-changed",
        "Production source, design, generated output, or declared renderer inputs changed while the PNG was being captured. Discard this mixed snapshot, compile the current project, and capture the frame again.",
      );
    let png: PNG;
    try {
      if (captured.bytes.length === 0)
        throw new Error("capture returned zero bytes");
      png = residentPngJs().PNG.sync.read(Buffer.from(captured.bytes));
    } catch (error) {
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-png-invalid",
        `${
          error instanceof Error ? error.message : String(error)
        }. The preview host must return a decodable PNG.`,
      );
    }
    let rendererIdentity: string;
    try {
      rendererIdentity = canonicalAutoMovieCaptureRuntimeIdentity(
        captured.runtimeIdentity,
      );
    } catch (error) {
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-renderer-identity-invalid",
        `${String(error)} Correct the capture adapter to supply its complete current runtime identity before these pixels enter a render bundle.`,
      );
    }
    const dialogueRuntimeIdentity: string | null = captured.dialogueRuntimeIdentity;
    if (
      dialogueRuntimeIdentity !== null &&
      SHA256_DIGEST_PATTERN.test(dialogueRuntimeIdentity) === false
    )
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-dialogue-identity-invalid",
        "The capture host returned an invalid dialogue runtime identity. Rebuild the current dialogue runtime and capture the frame again.",
      );
    if (input.target.kind !== "shot" && dialogueRuntimeIdentity !== null)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-dialogue-identity-invalid",
        "A non-shot capture must not claim a dialogue runtime identity. Clear the capture host dialogue state and capture the asset again.",
      );
    const semanticStatus: { status: "complete"; evidence: IAutoMovieProductionSemanticMaskEvidence; } | { status: "incomplete"; evidence: IAutoMovieProductionSemanticMaskEvidence; reason: string; } | { status: "not-run" | "unsupported" | "foreign" | "invalid"; reason: string; } | { status: "foreign"; } | null =
      input.target.kind === "shot"
        ? classifyAutoMovieProductionSemanticMaskEvidence({
            observation: captured.semanticMask,
            expectedShot: input.target.id,
          })
        : captured.semanticMask.status === "not-run"
          ? null
          : { status: "foreign" as const };
    if (
      semanticStatus !== null &&
      semanticStatus.status !== "complete" &&
      semanticStatus.status !== "incomplete" &&
      (pass === "mask" || captured.semanticMask.status === "available")
    )
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-failed",
        `The capture host returned ${semanticStatus.status} semantic evidence${"reason" in semanticStatus ? `: ${semanticStatus.reason}` : "."} Correct the capture host and capture this frame again.`,
      );
    if (
      captured.width !== width ||
      captured.height !== height ||
      png.width !== width ||
      png.height !== height
    )
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-size-mismatch",
        `Requested ${width}x${height}, adapter reported ${captured.width}x${captured.height}, and PNG decoded as ${png.width}x${png.height}. Fix the preview host viewport.`,
      );
    if (oracleServiceHasVisiblePixelVariance(png) === false)
      return oracleServicePreviewFailure(
        generated.inputFingerprint,
        "capture-png-blank",
        "The decoded PNG has no visible pixel variance. Fix the camera, lighting, scene, or preview host before using this frame as review evidence.",
      );
    const renderSpec: IAutoMovieRenderSpec = {
      target: input.target.id,
      frameFormat: {
        width,
        height,
        fps,
        ...(crop === undefined ? {} : { crop: structuredClone(crop) }),
      },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 17,
    };
    const relativeBundle: string = productionRenderBundleRelativePath({
      target: input.target,
      dialogueRuntimeIdentity,
      rendererIdentity,
      targetFingerprint,
      renderSpec,
    });
    const suffix: string = pass === "beauty" ? "" : `.${pass}`;
    const relativeFrame: string = `preview/frame_${String(index).padStart(6, "0")}${suffix}.png`;
    const bytes: Buffer<ArrayBuffer> = Buffer.from(captured.bytes);
    const digest: string = digestAutoMovieBytes(bytes);
    const bundleRoot: string = path.join(
      context.project.renderRoot(),
      ...relativeBundle.split("/"),
    );
    const nextFrame: IAutoMovieRenderBundleManifest["frames"][number] = {
      index,
      time,
      pass,
      path: relativeFrame,
      digest,
      width,
      height,
    };
    const semanticSidecar: { path: string; bytes: Buffer<ArrayBuffer>; evidence: IAutoMovieSemanticMaskEvidence; } | null =
      pass === "mask" &&
      semanticStatus !== null &&
      (semanticStatus.status === "complete" ||
        semanticStatus.status === "incomplete")
        ? {
            path: `preview/frame_${String(index).padStart(6, "0")}.mask.json`,
            bytes: Buffer.from(
              renderAutoMovieSemanticMaskSidecar(semanticStatus.evidence.mask),
              "utf8",
            ),
            evidence: semanticStatus.evidence,
          }
        : null;
    // A shot mask frame always reaches here with complete or incomplete
    // same-shot evidence: every other classification was refused above, so
    // the sidecar is present exactly when the target is a shot.
    const retained: IAutoMovieRenderBundleManifest["frames"] = oracleServiceRetainedBundleFrames(
      context.project,
      bundleRoot,
      {
        target: input.target,
        compileFingerprint: generated.inputFingerprint,
        dialogueRuntimeIdentity,
        rendererIdentity,
        targetFingerprint,
        renderSpec,
      },
      duration,
    ).filter((frame: IAutoMovieRenderBundleManifest["frames"][number]) : boolean => frame.index !== index || frame.pass !== pass);
    const frames: IAutoMovieRenderBundleManifest["frames"] = [...retained, nextFrame].sort(
      (left: IAutoMovieRenderBundleManifest["frames"][number], right: IAutoMovieRenderBundleManifest["frames"][number]) : number =>
        left.index - right.index || compareCodeUnits(left.pass, right.pass),
    );
    const priorManifest: IAutoMovieRenderBundleManifest | null = context.project.verifiedRenderManifest(
      path.join(bundleRoot, "manifest.json"),
    );
    const retainedKeys: Set<string> = new Set(
      retained.map((frame: IAutoMovieRenderBundleManifest["frames"][number]) : string => `${frame.index}\u0000${frame.pass}`),
    );
    const semanticMasks: IAutoMovieSemanticMaskReceipt[] = [
      ...(priorManifest?.semanticMasks.filter((record: IAutoMovieSemanticMaskReceipt) : boolean =>
        retainedKeys.has(`${record.frame}\u0000${record.pass}`),
      ) ?? []),
      ...(semanticSidecar === null
        ? []
        : [
            createAutoMovieProductionSemanticMaskReceipt({
              frame: index,
              expectedShot: input.target.id,
              evidence: semanticSidecar.evidence,
              sidecar: semanticSidecar,
            }),
          ]),
      // One bundle carries at most one mask receipt per frame, all for the
      // target shot, so frame order is total.
    ].sort((left: IAutoMovieSemanticMaskReceipt, right: IAutoMovieSemanticMaskReceipt) : number => left.frame - right.frame);
    const manifest: IAutoMovieRenderBundleManifest = {
      version: 6,
      target: input.target,
      compileFingerprint: generated.inputFingerprint,
      dialogueRuntimeIdentity,
      rendererIdentity,
      targetFingerprint,
      renderSpec,
      frames,
      semanticMasks,
    };
    try {
      context.project.commitRenderBundle(
        relativeBundle,
        new Map([
          [relativeFrame, bytes],
          ...(semanticSidecar === null
            ? []
            : ([[semanticSidecar.path, semanticSidecar.bytes]] as const)),
        ]),
        manifest,
        captureInputsCurrent,
      );
    } catch (error) {
      if (error instanceof AutoMovieProductionInputRaceError)
        return oracleServicePreviewFailure(
          generated.inputFingerprint,
          "capture-input-changed",
          `${error.message} Discard this mixed snapshot, compile the current project, and capture the frame again.`,
        );
      throw error;
    }
    return {
      captured: true,
      compileFingerprint: generated.inputFingerprint,
      renderBundle: normalizeSlash(
        path.relative(context.project.root, bundleRoot),
      ),
      frame: {
        index,
        time,
        pass,
        path: normalizeSlash(
          path.join(
            path.relative(context.project.root, bundleRoot),
            relativeFrame,
          ),
        ),
        mime: "image/png",
        digest,
        width,
        height,
      },
      diagnostics: [],
    };
  }
