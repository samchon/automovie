import {
  AutoMovieFilmEffectRuntimeError,
  type IAutoMovieProductionRenderFrame,
  autoMovieRenderDigest,
  canonicalizeAutoMovieJson,
  compareCodeUnits,
  equalProductionFrameRates,
  productionFilmEffectEditFingerprint,
  productionFrameBoundaryToGridTick,
  resolveProductionFrameRate,
  sampleProductionRenderFrame,
  verifyProductionFilmEffectPopulation,
} from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionDeliverable,
  IAutoMovieProductionDesign,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { canonicalProductionWebVtt } from "../caption/canonicalProductionWebVtt";
import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import type { IAutoMovieProductionRenderChunk } from "./IAutoMovieProductionRenderChunk";
import type { IAutoMovieProductionRenderJobPlan } from "./IAutoMovieProductionRenderJobPlan";
import type { IAutoMovieProductionRenderRuntimeIdentity } from "./IAutoMovieProductionRenderRuntimeIdentity";
import type { IAutoMovieProductionRenderTier } from "./IAutoMovieProductionRenderTier";
import { assertSingleGuidePass } from "./assertSingleGuidePass";
import { normalizeAudioAssets } from "./normalizeAudioAssets";
import { normalizeRenderTier } from "./normalizeRenderTier";
import { resolveProductionRenderTierFrameFormat } from "./resolveProductionRenderTierFrameFormat";
import { validDigest } from "./validDigest";

/** A deliverable that renders moving images, the only kind with chunks. */
type IMovingDeliverable = IAutoMovieProductionDeliverable & {
  kind: "feature" | "guide-pass";
};

/** One output-frame range shared by every moving deliverable's chunk. */
interface IRange {
  frameStart: number;
  frameEndExclusive: number;
  frames: IAutoMovieProductionRenderFrame[];
  sources: Array<{ shot: string; digest: string }>;
}

/**
 * Plan the content-addressed render chunks and publication tracks of one
 * production edit at one tier.
 *
 * The tier, which defaults to final, decimates the timeline by `frameStep` and
 * projects the raster; output frames are partitioned into ranges of at most
 * `chunkFrames`, and every feature and guide-pass deliverable gets one chunk
 * per range, in declaration order. A feature renders `beauty`; a guide-pass
 * deliverable renders its declared `pass`, or, for a legacy record without
 * one, the single pass in `guidePasses`, which defaults to `pose`. Each chunk
 * id digests the edit, effect digests, tier, frame formats, range, pass,
 * runtime identity and the source digest of every shot the range shows.
 *
 * Throws when `chunkFrames` is not a positive safe integer; a runtime,
 * compile or source digest is malformed or missing; the tier is inadmissible
 * or its raster is odd; the timeline's id, frame rate or runtime differs from
 * the production's, or its length is not a multiple of `frameStep`; the effect
 * runtimes are not exactly the timeline's current population for this
 * production, as an `AutoMovieFilmEffectRuntimeError`; an audio asset is
 * invalid or a cue's asset is missing or holds another sample count; or a
 * guide pass is unknown or not single. The inputs are not changed.
 *
 * @evidence contracts/common.md#principled-implementation The plan is a pure function of its inputs, so production verifies a stored plan by recomputing it; chunk ids are SHA-256 over canonical JSON of every input that decides a range's pixels, effect currentness is the engine's population proof plus the production owner check, and a cue's source length is mapped to asset samples with the engine's exact rational frame-to-tick rounding.
 * @evidence contracts/common.md#clear-and-simple-design Admission rules live in their helpers (`normalizeRenderTier`, `normalizeAudioAssets`, `assertSingleGuidePass`, `validDigest`) and the engine (`verifyProductionFilmEffectPopulation`, `sampleProductionRenderFrame`); this function orders them, builds each range once, and joins ranges with deliverables. The range walk repeats `planChunkedSequenceRender`'s arithmetic on purpose, because there the range index orders reassembly and here it is one field of a content-addressed slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `pose` default is the interface's documented legacy rule for a guide deliverable without a pass, the protocol and version literals are schema identities, and every refusal throws rather than skipping a deliverable, cue or shot.
 * @evidence contracts/common.md#meaningful-documentation The doc states the tier default and decimation, the range partition and chunk order, which pass each deliverable renders including the legacy default, what a chunk id digests, every refusal with the effect error type, and that inputs are left unchanged.
 * @evidence contracts/performance.md#efficient-algorithms For a timeline of T frames and S segments at step k, F = T / k output frames are sampled once each at O(S) per frame in the engine sampler, ranges and their sorted shot digests are built once and shared by all D moving deliverables, cues find assets through a path map, and each of the D times ceil(F / chunkFrames) chunks costs one canonical digest; the O(F S) sampling is the engine's segment scan and the dominant cost for long edits.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function computes one plan from one call's inputs and keeps nothing between calls; reuse of completed chunk work is keyed by the ids it emits and decided by production's status check.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The asset map, range list and per-chunk identity objects are local and released on return; the returned plan, owned by the caller, holds F frame records shared by the D chunks of each range, D times ceil(F / chunkFrames) chunk records, and copies of the caption, audio and effect tracks, with no handle or task.
 */
export const planProductionRenderJob = (props: {
  /** The builder-owned film edit. */
  timeline: IAutoMovieFilmTimeline;

  /** The compiled film-global effect runtimes for that edit. */
  effects: readonly IAutoMovieCompiledFilmEffect[];

  /** The production design the edit was compiled for. */
  production: IAutoMovieProductionDesign;

  /** Capture and encoder identity every chunk renders under. */
  runtimeIdentity: IAutoMovieProductionRenderRuntimeIdentity;

  /** SHA-256 source digest of every shot the edit shows, by shot id. */
  sourceFingerprints: Readonly<Record<string, string>>;

  /** Identity of every audio asset the edit's cues reference. */
  audioAssets: readonly IAutoMovieProductionAudioAssetIdentity[];

  /** Maximum output frames per chunk; a positive safe integer. */
  chunkFrames: number;

  /**
   * The one pass of a legacy guide deliverable that declares none; omitted is
   * `pose`.
   */
  guidePasses?: readonly Exclude<AutoMovieGuidePass, "beauty">[];

  /** Proxy or final tier; omitted is the exact final tier. */
  tier?: IAutoMovieProductionRenderTier;
}): IAutoMovieProductionRenderJobPlan => {
  if (
    Number.isSafeInteger(props.chunkFrames) === false ||
    props.chunkFrames <= 0
  )
    throw new Error(
      `chunkFrames must be a positive safe integer, but was ${props.chunkFrames}.`,
    );
  if (validDigest(props.runtimeIdentity.sourceDigest) === false)
    throw new Error(
      "Render runtime sourceDigest must be one current SHA-256 content identity.",
    );
  if (
    props.runtimeIdentity.dialogueRuntimeIdentity !== null &&
    validDigest(props.runtimeIdentity.dialogueRuntimeIdentity) === false
  )
    throw new Error(
      "Render runtime dialogueRuntimeIdentity must be null or one current SHA-256 content identity.",
    );
  const tier: IAutoMovieProductionRenderTier = normalizeRenderTier(props.tier);
  const frameFormat: IAutoMovieProductionDesign["frameFormat"] =
    resolveProductionRenderTierFrameFormat(props.production.frameFormat, tier);
  const outputRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(frameFormat);
  if (frameFormat.width % 2 !== 0 || frameFormat.height % 2 !== 0)
    throw new Error(
      "The production H.264 render adapter requires even width and height.",
    );
  const timelineRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(
    props.timeline,
  );
  const productionRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(props.production.frameFormat);
  if (
    props.production.id.trim().length === 0 ||
    props.timeline.id !== props.production.id ||
    validDigest(props.timeline.inputFingerprint) === false ||
    equalProductionFrameRates(timelineRate, productionRate) === false ||
    props.production.targetRuntimeSeconds !==
      (props.timeline.totalFrames * productionRate.denominator) /
        productionRate.numerator
  )
    throw new Error(
      "The film edit differs from the production identity, frame clock, or runtime. Recompile before planning.",
    );
  if (props.timeline.totalFrames % tier.frameStep !== 0)
    throw new Error(
      `Render tier "${tier.kind}" frameStep ${tier.frameStep} does not divide the ${props.timeline.totalFrames}-frame edit. Choose a divisor so proxy and final have the same exact runtime.`,
    );
  const audioAssets: IAutoMovieProductionAudioAssetIdentity[] =
    normalizeAudioAssets(props.audioAssets);
  const assetsByPath: Map<string, IAutoMovieProductionAudioAssetIdentity> =
    new Map(
      audioAssets.map(
        (
          asset: IAutoMovieProductionAudioAssetIdentity,
        ): [string, IAutoMovieProductionAudioAssetIdentity] => [
          asset.path,
          asset,
        ],
      ),
    );
  for (const cue of props.timeline.tracks.audio) {
    // `sourceDurationFrames` is the cue's claim about the complete asset, so
    // it must land on exactly the asset's sample count at the asset's own rate;
    // the trim inside that duration is the mix's own refusal.
    const asset: IAutoMovieProductionAudioAssetIdentity | undefined =
      assetsByPath.get(cue.asset);
    if (
      asset === undefined ||
      asset.sourceFrames !==
        productionFrameBoundaryToGridTick({
          frame: cue.sourceDurationFrames,
          frameRate: timelineRate,
          ticksPerSecond: asset.sampleRate,
          rounding: "nearest",
        })
    )
      throw new Error(
        `Audio cue "${cue.id}" lacks one digest-, format-, and duration-verified source asset.`,
      );
  }
  const legacyGuidePass: Exclude<AutoMovieGuidePass, "beauty"> =
    assertSingleGuidePass(props.guidePasses ?? ["pose"]);
  const editFingerprint: string =
    productionFilmEffectEditFingerprint(props.timeline);
  verifyProductionFilmEffectPopulation({
    timeline: props.timeline,
    effects: props.effects,
  });
  for (const effect of props.effects)
    if (effect.production !== props.production.id)
      throw new AutoMovieFilmEffectRuntimeError(
        "film-effect-runtime-stale",
        `Film effect runtime "${effect.effect.id}" belongs to production "${effect.production}", not "${props.production.id}".`,
      );
  const effectDigests: string[] = props.effects.map(
    (effect: IAutoMovieCompiledFilmEffect): string =>
      effect.digest,
  );
  const frames: IAutoMovieProductionRenderFrame[] = Array.from(
    { length: props.timeline.totalFrames / tier.frameStep },
    (_: unknown, outputFrame: number): IAutoMovieProductionRenderFrame => {
      const timelineFrame: number = outputFrame * tier.frameStep;
      return {
        ...sampleProductionRenderFrame(props.timeline, timelineFrame),
        globalFrame: outputFrame,
        timelineFrame,
        timeSeconds:
          (outputFrame * outputRate.denominator) / outputRate.numerator,
      };
    },
  );
  const moving: IMovingDeliverable[] = props.production.deliverables.filter(
    (deliverable: IAutoMovieProductionDeliverable): deliverable is IMovingDeliverable =>
      deliverable.kind === "feature" || deliverable.kind === "guide-pass",
  );
  const ranges: IRange[] = moving.length === 0 ? [] : partition(frames, props);
  const chunks: IAutoMovieProductionRenderChunk[] = [];
  for (const deliverable of moving) {
    const pass: AutoMovieGuidePass =
      deliverable.kind === "feature"
        ? "beauty"
        : deliverable.pass === undefined
          ? legacyGuidePass
          : assertSingleGuidePass([deliverable.pass]);
    ranges.forEach((range: IRange, index: number): void => {
      chunks.push({
        slot: `${props.production.id}:${tier.kind}:${deliverable.id}:${pass}:${index}`,
        id: autoMovieRenderDigest(
          canonicalizeAutoMovieJson({
            protocol: "automovie.production-render-chunk.v4",
            production: props.production.id,
            tier,
            deliverable: deliverable.id,
            kind: deliverable.kind,
            editFingerprint,
            effects: effectDigests,
            sourceFrameFormat: props.production.frameFormat,
            frameFormat,
            frameStart: range.frameStart,
            frameEndExclusive: range.frameEndExclusive,
            pass,
            runtimeIdentity: props.runtimeIdentity,
            sources: range.sources,
          }),
        ),
        deliverable: deliverable.id,
        kind: deliverable.kind,
        pass,
        frameStart: range.frameStart,
        frameEndExclusive: range.frameEndExclusive,
        frames: range.frames,
      });
    });
  }
  return {
    version: 4,
    productionId: props.production.id,
    compileFingerprint: props.timeline.inputFingerprint,
    editFingerprint,
    runtimeIdentity: props.runtimeIdentity,
    tier,
    sourceFrameFormat: structuredClone(props.production.frameFormat),
    frameFormat,
    totalFrames: frames.length,
    chunkFrames: props.chunkFrames,
    chunks,
    tracks: {
      captions: canonicalProductionWebVtt(props.timeline),
      audio: structuredClone(props.timeline.tracks.audio),
      audioAssets,
      effects: props.effects.map(
        (effect: IAutoMovieCompiledFilmEffect): IAutoMovieCompiledFilmEffect =>
          structuredClone(effect),
      ),
    },
  };
};

/**
 * Split the output frames into consecutive ranges of at most `chunkFrames` and
 * attach the code-unit-sorted source digest of every shot each range shows,
 * throwing for a shot without a valid digest.
 */
const partition = (
  frames: IAutoMovieProductionRenderFrame[],
  props: {
    chunkFrames: number;
    sourceFingerprints: Readonly<Record<string, string>>;
  },
): IRange[] => {
  const ranges: IRange[] = [];
  for (
    let frameStart: number = 0;
    frameStart < frames.length;
    frameStart += props.chunkFrames
  ) {
    const frameEndExclusive: number = Math.min(
      frameStart + props.chunkFrames,
      frames.length,
    );
    const range: IAutoMovieProductionRenderFrame[] = frames.slice(
      frameStart,
      frameEndExclusive,
    );
    const shots: Set<string> = new Set();
    for (const frame of range)
      for (const layer of frame.layers) shots.add(layer.shot);
    ranges.push({
      frameStart,
      frameEndExclusive,
      frames: range,
      sources: [...shots]
        .sort(compareCodeUnits)
        .map((shot: string): { shot: string; digest: string } => {
          const digest: string | undefined =
            props.sourceFingerprints[shot];
          if (digest === undefined || validDigest(digest) === false)
            throw new Error(
              `Render range references shot "${shot}" without one current builder-owned source fingerprint.`,
            );
          return { shot, digest };
        }),
    });
  }
  return ranges;
};
