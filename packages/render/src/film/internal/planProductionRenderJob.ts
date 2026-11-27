import { AutoMovieFilmEffectRuntimeError, AutoMovieEngineCanonicalJson, AutoMovieEngineText, AutoMovieEngineRenderTarget, AutoMovieEngineFilm, AutoMovieEngineEffect } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieCompiledFilmEffect,
  IAutoMoviePlanProductionRenderJobProps,
  IAutoMovieProductionAudioAssetIdentity,
  IAutoMovieProductionDeliverable,
  IAutoMovieProductionDesign,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionRenderChunk,
  IAutoMovieProductionRenderFrame,
  IAutoMovieProductionRenderJobPlan,
  IAutoMovieProductionRenderTier,
} from "@automovie/interface";

import { AutoMovieRenderCaption } from "../../caption/AutoMovieRenderCaption.js";
import { assertSingleGuidePass } from "./assertSingleGuidePass.js";
import { normalizeAudioAssets } from "./normalizeAudioAssets.js";
import { normalizeRenderTier } from "./normalizeRenderTier.js";
import { resolveProductionRenderTierFrameFormat } from "./resolveProductionRenderTierFrameFormat.js";
import { validDigest } from "./validDigest.js";

/**
 * Plan the content-addressed render chunks and publication tracks of one
 * production edit at one tier.
 *
 * The tier, which defaults to final, decimates the timeline by `frameStep` and
 * projects the raster; output frames are partitioned into ranges of at most
 * `chunkFrames`, and every feature and guide-pass deliverable gets one chunk
 * per range, in declaration order. A feature renders `beauty`; a guide-pass
 * deliverable renders its declared `pass`, or, for a legacy record without one,
 * the single pass in `guidePasses`, which defaults to `pose`. Each chunk id
 * digests the edit, effect digests, tier, frame formats, range, pass, runtime
 * identity and the source digest of every shot the range shows.
 *
 * Throws when `chunkFrames` is not a positive safe integer; a runtime, compile
 * or source digest is malformed or missing; the tier is inadmissible or its
 * raster is odd; the timeline's id, frame rate or runtime differs from the
 * production's, or its length is not a multiple of `frameStep`; the effect
 * runtimes are not exactly the timeline's current population for this
 * production, as an `AutoMovieFilmEffectRuntimeError`; an audio asset is
 * invalid or a cue's asset is missing or holds another sample count; or a guide
 * pass is unknown or not single. The inputs are not changed.
 *
 * Current maintained callers are planner tests. This function does not execute
 * a render, authenticate supplied runtime or source digests, or establish
 * stored-plan currentness for an application scheduler.
 */
export const planProductionRenderJob: (
  props: IAutoMoviePlanProductionRenderJobProps,
) => IAutoMovieProductionRenderJobPlan = (
  props: IAutoMoviePlanProductionRenderJobProps,
): IAutoMovieProductionRenderJobPlan => {
  if (props.chunkFrames <= 0)
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
    AutoMovieEngineFilm.resolveProductionFrameRate(frameFormat);
  if (frameFormat.width % 2 !== 0 || frameFormat.height % 2 !== 0)
    throw new Error(
      "The production H.264 render adapter requires even width and height.",
    );
  const timelineRate: IAutoMovieProductionFrameRate =
    AutoMovieEngineFilm.resolveProductionFrameRate(props.timeline);
  const productionRate: IAutoMovieProductionFrameRate =
    AutoMovieEngineFilm.resolveProductionFrameRate(props.production.frameFormat);
  if (
    props.production.id.trim().length === 0 ||
    props.timeline.id !== props.production.id ||
    validDigest(props.timeline.inputFingerprint) === false ||
    AutoMovieEngineFilm.equalProductionFrameRates(timelineRate, productionRate) === false ||
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
        AutoMovieEngineFilm.productionFrameBoundaryToGridTick({
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
  const editFingerprint: string = AutoMovieEngineEffect.productionFilmEffectEditFingerprint(
    props.timeline,
  );
  AutoMovieEngineEffect.verifyProductionFilmEffectPopulation({
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
    (effect: IAutoMovieCompiledFilmEffect): string => effect.digest,
  );
  const frames: IAutoMovieProductionRenderFrame[] = Array.from(
    { length: props.timeline.totalFrames / tier.frameStep },
    (_: unknown, outputFrame: number): IAutoMovieProductionRenderFrame => {
      const timelineFrame: number = outputFrame * tier.frameStep;
      return {
        ...AutoMovieEngineFilm.sampleProductionRenderFrame(props.timeline, timelineFrame),
        globalFrame: outputFrame,
        timelineFrame,
        timeSeconds:
          (outputFrame * outputRate.denominator) / outputRate.numerator,
      };
    },
  );
  const moving: IMovingDeliverable[] = props.production.deliverables.filter(
    (
      deliverable: IAutoMovieProductionDeliverable,
    ): deliverable is IMovingDeliverable =>
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
        id: AutoMovieEngineRenderTarget.autoMovieRenderDigest(
          AutoMovieEngineCanonicalJson.canonicalize({
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
      captions: AutoMovieRenderCaption.canonicalProductionWebVtt(props.timeline),
      audio: structuredClone(props.timeline.tracks.audio),
      audioAssets,
      effects: props.effects.map(
        (effect: IAutoMovieCompiledFilmEffect): IAutoMovieCompiledFilmEffect =>
          structuredClone(effect),
      ),
    },
  };
};

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
 * Split the output frames into consecutive ranges of at most `chunkFrames` and
 * attach the code-unit-sorted source digest of every shot each range shows,
 * throwing for a shot without a valid digest.
 */
const partition: (
  frames: IAutoMovieProductionRenderFrame[],
  props: {
    chunkFrames: number;
    sourceFingerprints: Readonly<Record<string, string>>;
  },
) => IRange[] = (
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
        .sort(AutoMovieEngineText.compareCodeUnits)
        .map((shot: string): { shot: string; digest: string } => {
          const digest: string | undefined = props.sourceFingerprints[shot];
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
