import { deriveProductionSoundPlan, equalProductionFrameRates, productionFrameBoundaryToGridTick, resolveProductionFrameRate } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieFilmTimeline, IAutoMovieProductionMediaProbe, IAutoMovieShotContract, type IAutoMovieAcousticResponseProfile, type IAutoMovieProductionAcousticResponse, type IAutoMovieProductionDialogueLine, type IAutoMovieProductionFrameRate, type IAutoMovieProductionSoundEvent, type IAutoMovieProductionSoundPlan, type IAutoMovieProductionTtsReceipt } from "@automovie/interface";
import path from "node:path";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";
import { normalizeSlash } from "./productionBuildDiagnostics";
import { verifyProductionNonVideoDeliverables } from "./verifyProductionNonVideoDeliverables";







import type { IProductionDeliveryObservedFile } from "./IProductionDeliveryObservedFile";
import { productionDeliveryValidationExactPresentationTicks } from "./productionDeliveryValidationExactPresentationTicks";

/**
 * Bind owned sound evidence to the current builder-derived plan, exact PCM boundary, selected acoustic outcomes, ordered event and TTS receipts, and final Opus presentation. This checks declared evidence rather than decoding audio to remeasure it.
 *
 * @evidence contracts/common.md#principled-implementation Canonical frame-rate equality and a rebuilt sound plan establish compile identity. A cloned evidence plan has acoustic results removed for the plan comparison; selected response identities, nearest sample boundaries, event tolerance of one frame, TTS order, and canonical evidence ownership are then checked.
 * @evidence contracts/common.md#clear-and-simple-design The ordered assertions preserve the existing first-failure behavior. Builder plan derivation, exact sample conversion, prior Opus profile admission, and non-video evidence parsing each keep their numeric or byte-format responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Event alignment retains the existing zero-to-one-frame accepted error interval and trimmed propagation uses its emission boundary. Analysis, clipping, and peak fields are structurally checked against owned evidence; they do not constitute independent PCM measurement or fresh acoustic simulation.
 * @evidence contracts/common.md#meaningful-documentation The comment names current compile, plan, sample and receipt ownership, the preceding Opus premise, and the distinction between evidence validation and audio remeasurement. Failures throw to the timeline diagnostic boundary.
 * @evidence contracts/performance.md#efficient-algorithms Plan derivation, structured cloning, canonical encoding, and event, alignment, dialogue, and receipt traversals scale with their full populations and evidence bytes. These full comparisons establish exact current ownership, without an imposed event or byte quota.
 * @evidence contracts/performance.md#reuse-equivalent-work The rebuilt plan and resolved frame rate are reused through this call; only the private cloned plan is mutated. No evidence verdict is cached across invocations because contracts, compiled shots, selected sound profiles, and resident bytes decide equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Expected and cloned plans, canonical buffers, and id arrays survive only through validation. The caller owns original evidence and audio bytes; this helper opens no descriptors, launches no synthesis, and retains no native resources.
 */
export const productionDeliveryValidationAssertCurrentSoundEvidence: (props: { inputFingerprint: string; production: NonNullable<ReturnType<AutoMovieProductionProject["graph"]>["production"]>; timeline: IAutoMovieFilmTimeline; contracts: ReadonlyMap<string, IAutoMovieShotContract>; compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>; evidence: Extract<IAutoMovieProductionMediaProbe, { kind: "sound-evidence"; }>["evidence"]; evidenceBytes: Uint8Array; audio: IProductionDeliveryObservedFile & { probe: Extract<IAutoMovieProductionMediaProbe, { kind: "audio"; }>; }; }) => void = (props: {
  inputFingerprint: string;
  production: NonNullable<
    ReturnType<AutoMovieProductionProject["graph"]>["production"]
  >;
  timeline: IAutoMovieFilmTimeline;
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;
  compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
  evidence: Extract<
    IAutoMovieProductionMediaProbe,
    { kind: "sound-evidence" }
  >["evidence"];
  evidenceBytes: Uint8Array;
  audio: IProductionDeliveryObservedFile & {
    probe: Extract<IAutoMovieProductionMediaProbe, { kind: "audio" }>;
  };
}): void => {
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(props.timeline);
  const planRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(props.evidence.plan);
  if (
    props.evidence.plan.inputFingerprint !== props.inputFingerprint ||
    props.timeline.inputFingerprint !== props.inputFingerprint ||
    props.evidence.plan.totalFrames !== props.timeline.totalFrames ||
    equalProductionFrameRates(planRate, frameRate) === false
  )
    throw new Error(
      "Sound evidence plan does not share the current compile fingerprint, exact frame rate, and total frame count.",
    );
  const expectedPlan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: props.timeline,
    contracts: props.contracts,
    compiled: props.compiled,
    ...(props.production.sound?.propagation === undefined
      ? {}
      : { propagationProfile: props.production.sound.propagation }),
    ...(props.production.sound?.acousticResponse === undefined
      ? {}
      : { acousticProfile: props.production.sound.acousticResponse }),
  });
  const actualPlanWithoutAcoustics: IAutoMovieProductionSoundPlan = structuredClone(props.evidence.plan);
  for (const event of actualPlanWithoutAcoustics.events)
    delete event.acousticResponse;
  if (
    Buffer.from(canonicalAutoMovieJsonBytes(actualPlanWithoutAcoustics)).equals(
      Buffer.from(canonicalAutoMovieJsonBytes(expectedPlan)),
    ) === false
  )
    throw new Error(
      "Sound evidence does not contain the complete current builder-derived sound plan.",
    );
  const acousticProfile: IAutoMovieAcousticResponseProfile | undefined = props.production.sound?.acousticResponse;
  for (const event of props.evidence.plan.events) {
    const response: IAutoMovieProductionAcousticResponse | undefined = event.acousticResponse;
    if (acousticProfile === undefined && response !== undefined)
      throw new Error(
        `Sound event "${event.id}" carries an undeclared acoustic response.`,
      );
    if (acousticProfile !== undefined && response === undefined)
      throw new Error(
        `Sound event "${event.id}" lacks its selected acoustic response outcome.`,
      );
    if (
      response?.status === "available" &&
      (response.profile !== acousticProfile?.id ||
        response.inputRevision !== props.inputFingerprint)
    )
      throw new Error(
        `Sound event "${event.id}" acoustic response is not bound to the current selected profile and compile.`,
      );
  }
  const expectedSampleFrames: number = productionFrameBoundaryToGridTick({
    frame: props.timeline.totalFrames,
    frameRate,
    ticksPerSecond: props.evidence.plan.sampleRate,
    rounding: "nearest",
  });
  if (
    props.evidence.analysis.sampleRate !== props.evidence.plan.sampleRate ||
    props.evidence.analysis.sampleFrames !== expectedSampleFrames ||
    props.evidence.analysis.runtimeSeconds !==
      expectedSampleFrames / props.evidence.plan.sampleRate ||
    props.evidence.analysis.clippingSamples !== 0 ||
    props.evidence.analysis.samplePeak < 0 ||
    props.evidence.analysis.samplePeak > 1
  )
    throw new Error(
      "Sound analysis does not describe the exact current pre-encode PCM boundary and unclipped domain.",
    );
  const expectedEventIds: string[] = props.evidence.plan.events.map((event: IAutoMovieProductionSoundEvent) : string => event.id);
  const observedEventIds: string[] = props.evidence.analysis.eventAlignment.map(
    (event: { id: string; expectedSeconds: number; peakSeconds: number; errorFrames: number; passed: boolean; }) : string => event.id,
  );
  if (JSON.stringify(observedEventIds) !== JSON.stringify(expectedEventIds))
    throw new Error(
      "Sound analysis event identities or order differ from the current plan.",
    );
  props.evidence.analysis.eventAlignment.forEach((alignment: { id: string; expectedSeconds: number; peakSeconds: number; errorFrames: number; passed: boolean; }, index: number) : void => {
    const event: IAutoMovieProductionSoundEvent = props.evidence.plan.events[index]!;
    const expectedFrame: number =
      event.propagation?.boundary === "trimmed-at-segment"
        ? event.frame
        : (event.propagation?.arrivalFrame ?? event.frame);
    const expectedSample: number = productionFrameBoundaryToGridTick({
      frame: expectedFrame,
      frameRate,
      ticksPerSecond: props.evidence.plan.sampleRate,
      rounding: "nearest",
    });
    if (
      alignment.expectedSeconds !==
        expectedSample / props.evidence.plan.sampleRate ||
      alignment.passed === false ||
      alignment.errorFrames < 0 ||
      alignment.errorFrames > 1
    )
      throw new Error(
        `Sound analysis event "${alignment.id}" does not match its current planned boundary and passing frame gate.`,
      );
  });
  const expectedTtsLines: string[] = props.evidence.plan.dialogue.map((line: IAutoMovieProductionDialogueLine) : string => line.id);
  const observedTtsLines: string[] = props.evidence.tts.map((receipt: IAutoMovieProductionTtsReceipt) : string => receipt.line);
  if (JSON.stringify(observedTtsLines) !== JSON.stringify(expectedTtsLines))
    throw new Error(
      "Sound TTS receipt identities or order differ from current dialogue.",
    );
  const presentationSamples: number = productionDeliveryValidationExactPresentationTicks(
    props.audio.probe.timebase.movieDuration,
    props.audio.probe.timebase.movieTimescale,
    props.audio.probe.timebase.mediaTimescale,
  );
  if (presentationSamples !== expectedSampleFrames)
    throw new Error(
      "Final Opus presentation does not end at the current pre-encode PCM boundary.",
    );
  verifyProductionNonVideoDeliverables({
    caption: null,
    sound: {
      expectedPlan: props.evidence.plan,
      expectedAnalysis: props.evidence.analysis,
      expectedTts: props.evidence.tts,
      expectedAudio: {
        path: path.posix.basename(normalizeSlash(props.audio.file.path)),
        mediaType: "audio/mp4",
        bytes: props.audio.file.bytes,
        digest: props.audio.file.digest,
      },
      evidence: props.evidenceBytes,
    },
  });
};
