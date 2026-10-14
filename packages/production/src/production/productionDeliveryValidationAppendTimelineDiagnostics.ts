import { resolveProductionFrameRate } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieProductionMediaProbe, IAutoMovieProductionRenderManifest, IAutoMovieShotContract, type IAutoMovieProductionAudioProbe, type IAutoMovieProductionDeliverable, type IAutoMovieProductionFrameRate, type IAutoMovieProductionPngPicture, type IAutoMovieProductionSoundEvidence, type IAutoMovieProductionVideoProbe, type IAutoMovieProductionWebVttCue, type IAutoMovieSemanticMask } from "@automovie/interface";
import { assertProductionOpusProfile, assertProductionPngPicture, assertProductionVideoProfile, canonicalProductionWebVtt, resolveProductionPngProfile, resolveProductionVideoProfile, type IAutoMovieProductionVideoProfile } from "@automovie/render";
import path from "node:path";
import { AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE } from "./AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { assertProductionRenderedDeliverableFacts } from "./assertProductionRenderedDeliverableFacts";
import { errorMessage, normalizeSlash } from "./productionBuildDiagnostics";
import { verifyProductionNonVideoDeliverables } from "./verifyProductionNonVideoDeliverables";









import type { IProductionDeliveryObservedFile } from "./IProductionDeliveryObservedFile";
import { productionDeliveryValidationAssertCurrentSoundEvidence } from "./productionDeliveryValidationAssertCurrentSoundEvidence";
import { productionDeliveryValidationAssertExactVideoTimeline } from "./productionDeliveryValidationAssertExactVideoTimeline";
import { productionDeliveryValidationDiagnostic } from "./productionDeliveryValidationDiagnostic";

/**
 * Check admitted observed files against a canonical film timeline and append a media mismatch. A missing timeline returns; frame-rate and video-profile resolution occurs before the guarded media checks and may propagate errors.
 *
 * @evidence contracts/common.md#principled-implementation Probe-kind narrowing and exact populations bind each supported deliverable to current timeline facts: feature and guide video clocks, ordered guide PNGs and mask sidecars, preview PNGs, canonical WebVTT, or four-part audio evidence. Typed probe admission supplies structural premises.
 * @evidence contracts/common.md#clear-and-simple-design One branch per supported deliverable keeps its file population and profile rules together. Exact video timing and sound evidence are separate helpers, while the local generic selectors preserve narrowed media types and refuse ambiguous single-file roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only files with matching receipt tuples and probes enter this helper, while separately recorded resident size or digest errors remain in the caller's diagnostics. An incomplete observed population is refused. Mask sidecars and audio evidence are required by their declared roles; preview pictures are checked for profile rather than claimed to prove timeline coverage or appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the null-timeline behavior and the error boundary before profile resolution. The acknowledgments describe required file populations, exact clocks, and the limits of structural audio and preview validation.
 * @evidence contracts/performance.md#efficient-algorithms Repeated probe-kind filters and guide frame traversals scan the current deliverable's file population, with canonical caption encoding, PNG validation, and sound-plan work adding their input costs. Full comparisons are required to bind every admitted role.
 * @evidence contracts/performance.md#reuse-equivalent-work The resolved rate, profile, declared contract, and observed buffers are reused within the branch. No cross-review cache shares a verdict because timelines, contracts, and resident media facts are independently current inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered role arrays borrow observed buffers and are released with the call; their count follows manifest files with no local quota. The caller owns diagnostics and observed byte buffers, and this helper acquires no filesystem or native handles.
 */
export const productionDeliveryValidationAppendTimelineDiagnostics: (diagnostics: IAutoMovieDiagnostic[], production: NonNullable<ReturnType<AutoMovieProductionProject["graph"]>["production"]>, inputFingerprint: string, contracts: ReadonlyMap<string, IAutoMovieShotContract>, compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>, timeline: IAutoMovieFilmTimeline | null, deliverable: IAutoMovieProductionRenderManifest["deliverables"][number], observed: readonly IProductionDeliveryObservedFile[]) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  production: NonNullable<
    ReturnType<AutoMovieProductionProject["graph"]>["production"]
  >,
  inputFingerprint: string,
  contracts: ReadonlyMap<string, IAutoMovieShotContract>,
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>,
  timeline: IAutoMovieFilmTimeline | null,
  deliverable: IAutoMovieProductionRenderManifest["deliverables"][number],
  observed: readonly IProductionDeliveryObservedFile[],
): void => {
  if (timeline === null) return;
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(production.frameFormat);
  const profile: IAutoMovieProductionVideoProfile = resolveProductionVideoProfile({
    width: production.frameFormat.width,
    height: production.frameFormat.height,
    frameRate,
  });
  const contract: IAutoMovieProductionDeliverable | undefined = production.deliverables.find(
    (candidate: IAutoMovieProductionDeliverable) : boolean => candidate.id === deliverable.id,
  );
  const byProbeKind: <Kind extends IAutoMovieProductionMediaProbe["kind"]>(kind: Kind) => Array<IProductionDeliveryObservedFile & { probe: Extract<IAutoMovieProductionMediaProbe, { kind: Kind; }>; }> = <Kind extends IAutoMovieProductionMediaProbe["kind"]>(
    kind: Kind,
  ): Array<
    IProductionDeliveryObservedFile & {
      probe: Extract<IAutoMovieProductionMediaProbe, { kind: Kind }>;
    }
  > =>
    observed.filter(
      (
        item: IProductionDeliveryObservedFile,
      ): item is IProductionDeliveryObservedFile & {
        probe: Extract<IAutoMovieProductionMediaProbe, { kind: Kind }>;
      } => item.probe.kind === kind,
    );
  const exactlyOne: <Item>(items: readonly Item[], label: string) => Item = <Item>(items: readonly Item[], label: string): Item => {
    if (items.length !== 1)
      throw new Error(
        `Expected exactly one ${label}, observed ${items.length}.`,
      );
    return items[0]!;
  };
  try {
    if (observed.length !== deliverable.files.length)
      throw new Error(
        "Not every manifest file passed its exact current receipt and probe comparison.",
      );
    if (deliverable.kind === "feature") {
      // Every observed feature file probed as one video/mp4 feature, so the
      // single-file rule is the exactly-one rule above.
      const feature: IProductionDeliveryObservedFile & { probe: { kind: "feature"; video: IAutoMovieProductionVideoProbe; audio: IAutoMovieProductionAudioProbe; }; } = exactlyOne(byProbeKind("feature"), "feature MP4");
      assertProductionRenderedDeliverableFacts({
        kind: deliverable.kind,
        runtimeSeconds: deliverable.runtimeSeconds,
        frameCount: deliverable.frameCount,
        codec: deliverable.codec,
        expectedCaptionRuntimeSeconds: null,
        probe: feature.probe,
      });
      assertProductionVideoProfile({
        expected: profile,
        actual: feature.probe.video,
      });
      assertProductionOpusProfile(feature.probe.audio);
      // The feature probe proved positive presentation clocks and exactly
      // equal audio and video runtimes when it admitted the file.
      productionDeliveryValidationAssertExactVideoTimeline(feature.probe.video, timeline);
      return;
    }
    if (deliverable.kind === "guide-pass") {
      // The probe admits a guide video only under video/mp4.
      const video: IProductionDeliveryObservedFile & { probe: IAutoMovieProductionVideoProbe; } = exactlyOne(byProbeKind("video"), "guide video/mp4");
      assertProductionRenderedDeliverableFacts({
        kind: deliverable.kind,
        runtimeSeconds: deliverable.runtimeSeconds,
        frameCount: deliverable.frameCount,
        codec: deliverable.codec,
        expectedCaptionRuntimeSeconds: null,
        probe: video.probe,
      });
      assertProductionVideoProfile({ expected: profile, actual: video.probe });
      productionDeliveryValidationAssertExactVideoTimeline(video.probe, timeline);
      const controls: (IProductionDeliveryObservedFile & { probe: { kind: "png"; width: number; height: number; picture: IAutoMovieProductionPngPicture; }; })[] = byProbeKind("png");
      const semantics: (IProductionDeliveryObservedFile & { probe: { kind: "semantic-mask"; mask: IAutoMovieSemanticMask; }; })[] = byProbeKind("semantic-mask");
      const guidePass: "depth" | "mask" | "normal" | "outline" | "pose" =
        contract?.kind === "guide-pass" ? (contract.pass ?? "pose") : "pose";
      const expectedSemantics: number = guidePass === "mask" ? timeline.totalFrames : 0;
      if (
        controls.length !== timeline.totalFrames ||
        semantics.length !== expectedSemantics ||
        observed.length !== controls.length + semantics.length + 1
      )
        throw new Error(
          `Guide delivery requires ${timeline.totalFrames} PNG controls and ${expectedSemantics} semantic sidecars beside its video.`,
        );
      controls.forEach((control: IProductionDeliveryObservedFile & { probe: { kind: "png"; width: number; height: number; picture: IAutoMovieProductionPngPicture; }; }, index: number) : void => {
        const suffix: string = `frames/${guidePass}/frame_${String(index).padStart(8, "0")}.png`;
        const portablePath: string = control.file.path;
        if (
          control.file.mediaType !== "image/png" ||
          (portablePath !== suffix &&
            portablePath.endsWith(`/${suffix}`) === false)
        )
          throw new Error(
            `Guide control ${index} must own the continuous path "${suffix}".`,
          );
        assertProductionPngPicture({
          profile: resolveProductionPngProfile({
            role: "guide-frame",
            width: production.frameFormat.width,
            height: production.frameFormat.height,
          }),
          actual: control.probe.picture,
        });
      });
      // Each mask picture depends on the sidecar of the same output frame, so
      // the sidecar series must be continuous in the same numbering as the
      // controls and each receipt must name the frame its filename claims.
      semantics.forEach((semantic: IProductionDeliveryObservedFile & { probe: { kind: "semantic-mask"; mask: IAutoMovieSemanticMask; }; }, index: number) : void => {
        const suffix: string = `frames/mask/frame_${String(index).padStart(8, "0")}.semantic.json`;
        const portablePath: string = semantic.file.path;
        if (
          semantic.file.mediaType !== AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE ||
          semantic.file.semanticMask?.frame !== index ||
          (portablePath !== suffix &&
            portablePath.endsWith(`/${suffix}`) === false)
        )
          throw new Error(
            `Mask semantic sidecar ${index} must own the continuous path "${suffix}" and a semantic receipt for output frame ${index}.`,
          );
      });
      return;
    }
    if (deliverable.kind === "preview") {
      const pictures: (IProductionDeliveryObservedFile & { probe: { kind: "png"; width: number; height: number; picture: IAutoMovieProductionPngPicture; }; })[] = byProbeKind("png");
      if (pictures.length === 0 || pictures.length !== observed.length)
        throw new Error(
          "Preview delivery must own one or more PNG pictures only.",
        );
      assertProductionRenderedDeliverableFacts({
        kind: deliverable.kind,
        runtimeSeconds: deliverable.runtimeSeconds,
        frameCount: deliverable.frameCount,
        codec: deliverable.codec,
        expectedCaptionRuntimeSeconds: null,
        probe: pictures[0]!.probe,
      });
      // The probe admits a preview picture only under image/png.
      for (const picture of pictures)
        assertProductionPngPicture({
          profile: resolveProductionPngProfile({
            role: "preview",
            width: production.frameFormat.width,
            height: production.frameFormat.height,
          }),
          actual: picture.probe.picture,
        });
      return;
    }
    if (deliverable.kind === "captions") {
      // The probe admits captions only under text/vtt, and every observed
      // caption file probed as WebVTT, so exactly-one owns the count.
      const caption: IProductionDeliveryObservedFile & { probe: { kind: "webvtt"; cueCount: number; firstCueSeconds: number; lastCueSeconds: number; cues: IAutoMovieProductionWebVttCue[]; text: string; }; } = exactlyOne(byProbeKind("webvtt"), "caption WebVTT");
      assertProductionRenderedDeliverableFacts({
        kind: deliverable.kind,
        runtimeSeconds: deliverable.runtimeSeconds,
        frameCount: deliverable.frameCount,
        codec: deliverable.codec,
        expectedCaptionRuntimeSeconds: production.targetRuntimeSeconds,
        probe: caption.probe,
      });
      verifyProductionNonVideoDeliverables({
        caption: {
          required: contract?.required ?? true,
          expected: canonicalProductionWebVtt(timeline),
          actual: caption.bytes,
        },
        sound: null,
      });
      return;
    }

    const audio: IProductionDeliveryObservedFile & { probe: IAutoMovieProductionAudioProbe; } = exactlyOne(byProbeKind("audio"), "audio/mp4 mix");
    const evidence: IProductionDeliveryObservedFile & { probe: { kind: "sound-evidence"; evidence: IAutoMovieProductionSoundEvidence; }; } = exactlyOne(
      byProbeKind("sound-evidence"),
      "sound evidence JSON",
    );
    const pictures: (IProductionDeliveryObservedFile & { probe: { kind: "png"; width: number; height: number; picture: IAutoMovieProductionPngPicture; }; })[] = byProbeKind("png");
    if (observed.length !== 4 || pictures.length !== 2)
      throw new Error(
        "Audio delivery must own audio.mp4, evidence.json, waveform.png, and spectrogram.png only.",
      );
    // The probe yields an audio track only under audio/mp4 and sound evidence
    // only under application/json, so both media types are already exact.
    assertProductionRenderedDeliverableFacts({
      kind: deliverable.kind,
      runtimeSeconds: deliverable.runtimeSeconds,
      frameCount: deliverable.frameCount,
      codec: deliverable.codec,
      expectedCaptionRuntimeSeconds: null,
      probe: audio.probe,
    });
    assertProductionOpusProfile(audio.probe);
    productionDeliveryValidationAssertCurrentSoundEvidence({
      inputFingerprint,
      production,
      timeline,
      contracts,
      compiled,
      evidence: evidence.probe.evidence,
      evidenceBytes: evidence.bytes,
      audio,
    });
    for (const picture of pictures) {
      const name: string = path.posix.basename(normalizeSlash(picture.file.path));
      const role: "waveform" | "spectrogram" | null =
        name === "waveform.png"
          ? "waveform"
          : name === "spectrogram.png"
            ? "spectrogram"
            : null;
      if (role === null || picture.file.mediaType !== "image/png")
        throw new Error(
          `Unexpected audio evidence raster "${picture.file.path}".`,
        );
      assertProductionPngPicture({
        profile: resolveProductionPngProfile({ role }),
        actual: picture.probe.picture,
      });
    }
  } catch (error) {
    diagnostics.push(
      productionDeliveryValidationDiagnostic(
        "render-deliverable-media-mismatch",
        deliverable.id,
        `${errorMessage(error)} Re-render the declared deliverable from the current timeline and semantic plan.`,
      ),
    );
  }
};
