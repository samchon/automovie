import type {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionDesign,
} from "@automovie/interface";
import {
  type IAutoMovieProductionAudioAssetIdentity,
  type IAutoMovieProductionRenderJobPlan,
  type IAutoMovieProductionRenderRuntimeIdentity,
  planProductionRenderJob,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import {
  filmEffectRefusal,
  filmEffectTimeline,
  materializedFilmEffects,
  resealFilmEffect,
} from "../film/filmEffectRuntimeFixtures";
import { GRAPHICS_FIXTURE } from "../internal/renderBudgetFixtures";
import { throwsError } from "../internal/predicates";

const SHOT_DIGEST = `sha256:${"e".repeat(64)}` as const;

/** The 48-frame, 24 fps effect fixture film, owned by production `production`. */
const timeline = (
  audio: IAutoMovieFilmTimeline["tracks"]["audio"] = [],
): IAutoMovieFilmTimeline => {
  const base: IAutoMovieFilmTimeline = filmEffectTimeline();
  return {
    ...base,
    id: "production",
    tracks: { ...base.tracks, audio },
  };
};

/** A 2-second, 16 x 16 production with one deliverable of every listed kind. */
const production = (
  deliverables: IAutoMovieProductionDesign["deliverables"] = [
    { id: "feature", kind: "feature", required: true },
    { id: "depth", kind: "guide-pass", pass: "depth", required: true },
    { id: "captions", kind: "captions", required: true },
  ],
): IAutoMovieProductionDesign => ({
  id: "production",
  title: "Plan",
  logline: "A render plan fixture.",
  targetRuntimeSeconds: 2,
  visualDelivery: "deterministic",
  frameFormat: { width: 16, height: 16, fps: 24, colorSpace: "srgb" },
  artDirection: {
    style: "primitive-3d",
    palette: ["#000000"],
    silhouettePriority: "Keep the subject readable.",
    scaleGrammar: "Primitives keep their real size.",
  },
  deliverables,
});

const runtimeIdentity = (): IAutoMovieProductionRenderRuntimeIdentity => ({
  protocolVersion: "automovie.production-render-runtime.v3",
  sourceDigest: `sha256:${"a".repeat(64)}`,
  dialogueRuntimeIdentity: null,
  capture: {
    protocolVersion: "automovie.capture-runtime.v2",
    playwright: { package: "playwright", version: "1.55.0" },
    runtimeClosure: {
      protocolVersion: "automovie.capture-runtime-closure.v1",
      contentDigest: `sha256:${"b".repeat(64)}`,
      packages: [],
      browserSupport: {
        status: "system-channel-unsealed",
        source: "system-channel",
      },
    },
    browser: {
      product: "chromium",
      version: "140.0.0",
      revision: null,
      source: "system-channel",
      executableDigest: null,
    },
    platform: { os: "linux", arch: "x64" },
    mode: { headless: "chromium", deviceScaleFactor: 1 },
    graphics: GRAPHICS_FIXTURE,
  },
  encoder: {
    package: "h264-mp4-encoder",
    version: "1.0.12",
    closureDigest: `sha256:${"d".repeat(64)}`,
    codec: "h264",
    arguments: { quantizationParameter: 20, speed: 4, groupOfPictures: 24 },
  },
});

/** A 48 kHz stereo placeholder stem holding `sourceFrames` sample frames. */
const stem = (sourceFrames: number): IAutoMovieProductionAudioAssetIdentity => ({
  kind: "placeholder-audio-stem",
  path: "audio/stem.wav",
  digest: `sha256:${"f".repeat(64)}`,
  durationSeconds: sourceFrames / 48_000,
  sourceFrames,
  sampleRate: 48_000,
  channels: 2,
});

/** One cue playing the whole 48-frame stem from frame 0. */
const CUE: IAutoMovieFilmTimeline["tracks"]["audio"][number] = {
  id: "cue",
  asset: "audio/stem.wav",
  sourceDurationFrames: 48,
  sourceOffsetFrame: 0,
  startFrame: 0,
  durationFrames: 48,
  gain: 1,
  fadeInFrames: 0,
  fadeOutFrames: 0,
  bus: "music",
};

type IPlanProps = Parameters<typeof planProductionRenderJob>[0];

const plan = (
  overrides: Partial<IPlanProps> = {},
): IAutoMovieProductionRenderJobPlan => {
  const film: IAutoMovieFilmTimeline = overrides.timeline ?? timeline();
  return planProductionRenderJob({
    timeline: film,
    effects: materializedFilmEffects(film),
    production: production(),
    runtimeIdentity: runtimeIdentity(),
    sourceFingerprints: { shot: SHOT_DIGEST },
    audioAssets: [],
    chunkFrames: 20,
    ...overrides,
  });
};

/**
 * The production render planner partitions one edit into content-addressed
 * chunks and refuses inputs that are not current for that edit.
 *
 * Expected ranges, slots and frame counts follow from the planner's contract:
 * output frames are the timeline length divided by the tier step, ranges are
 * consecutive `chunkFrames` slices, each moving deliverable gets one chunk per
 * range keyed `<production>:<tier>:<deliverable>:<pass>:<index>`, and a
 * caption deliverable gets none. Chunk id bytes are owned by
 * `test_render_plan_chunk_digest_parity`; here ids are only compared with each
 * other.
 *
 * Scenarios:
 *
 * 1. A final plan of the 48-frame film at 20 frames per chunk has ranges 0-20,
 *    20-40 and 40-48 for the feature (beauty) and the depth guide, no caption
 *    chunks, frames that show the one shot, distinct ids per deliverable and
 *    range, and the same ids when planned again.
 * 2. A proxy at half scale and step 2 plans 24 output frames at 8 x 8 and 12
 *    fps, sampling timeline frames 0, 2, 4 and so on, with ranges 0-20 and
 *    20-24.
 * 3. A guide deliverable without a pass renders the caller's legacy pass, or
 *    `pose` when none is given, and two distinct legacy passes are refused.
 * 4. The effect runtimes must be the timeline's whole current population for
 *    this production: a truncated population is refused as invalid and a
 *    runtime resealed under another production is refused as stale.
 * 5. An audio cue joins its asset by path and must name exactly the asset's
 *    sample count; one sample short and a missing asset are both refused, as
 *    is a shot without a source digest.
 */
export const test_render_production_job_plan = (): void => {
  const final: IAutoMovieProductionRenderJobPlan = plan();
  TestValidator.equals(
    "a final plan partitions both moving deliverables into the same ranges",
    {
      totalFrames: final.totalFrames,
      chunks: final.chunks.map((chunk) => ({
        slot: chunk.slot,
        kind: chunk.kind,
        pass: chunk.pass,
        range: [chunk.frameStart, chunk.frameEndExclusive],
        frames: chunk.frames.length,
      })),
    },
    {
      totalFrames: 48,
      chunks: [
        ["feature", "feature", "beauty", 0, 0, 20],
        ["feature", "feature", "beauty", 1, 20, 40],
        ["feature", "feature", "beauty", 2, 40, 48],
        ["depth", "guide-pass", "depth", 0, 0, 20],
        ["depth", "guide-pass", "depth", 1, 20, 40],
        ["depth", "guide-pass", "depth", 2, 40, 48],
      ].map(([deliverable, kind, pass, index, start, end]) => ({
        slot: `production:final:${deliverable}:${pass}:${index}`,
        kind: kind as "feature" | "guide-pass",
        pass: pass as "beauty" | "depth",
        range: [start as number, end as number],
        frames: (end as number) - (start as number),
      })),
    },
  );
  TestValidator.equals(
    "every planned frame shows the fixture's one shot",
    final.chunks.every((chunk) =>
      chunk.frames.every((frame) =>
        frame.layers.every((layer) => layer.shot === "shot"),
      ),
    ),
    true,
  );
  TestValidator.equals(
    "ids are distinct per deliverable and range and stable across plans",
    {
      distinct: new Set(final.chunks.map((chunk) => chunk.id)).size,
      repeated: plan().chunks.map((chunk) => chunk.id),
    },
    { distinct: 6, repeated: final.chunks.map((chunk) => chunk.id) },
  );

  const proxy: IAutoMovieProductionRenderJobPlan = plan({
    tier: { kind: "proxy", resolutionScale: 0.5, frameStep: 2 },
  });
  TestValidator.equals(
    "a proxy decimates frames and halves the raster",
    {
      totalFrames: proxy.totalFrames,
      frameFormat: [
        proxy.frameFormat.width,
        proxy.frameFormat.height,
        proxy.frameFormat.fps,
      ],
      ranges: proxy.chunks
        .filter((chunk) => chunk.kind === "feature")
        .map((chunk) => [chunk.frameStart, chunk.frameEndExclusive]),
      timelineFrames: proxy.chunks[0]!.frames
        .slice(0, 3)
        .map((frame) => [frame.globalFrame, frame.timelineFrame]),
      slot: proxy.chunks[0]!.slot,
    },
    {
      totalFrames: 24,
      frameFormat: [8, 8, 12],
      ranges: [
        [0, 20],
        [20, 24],
      ],
      timelineFrames: [
        [0, 0],
        [1, 2],
        [2, 4],
      ],
      slot: "production:proxy:feature:beauty:0",
    },
  );

  const legacy: IAutoMovieProductionDesign = production([
    { id: "guide", kind: "guide-pass", required: true },
  ]);
  TestValidator.equals(
    "a guide deliverable without a pass renders the legacy pass",
    {
      declared: plan({ production: legacy, guidePasses: ["normal"] }).chunks[0]!
        .pass,
      defaulted: plan({ production: legacy }).chunks[0]!.pass,
      twoPasses: throwsError(
        () => plan({ production: legacy, guidePasses: ["normal", "mask"] }),
        "exactly one declared pass",
      ),
    },
    { declared: "normal", defaulted: "pose", twoPasses: true },
  );

  const film: IAutoMovieFilmTimeline = timeline();
  const effects: IAutoMovieCompiledFilmEffect[] = materializedFilmEffects(film);
  TestValidator.equals(
    "the effect runtimes must be the whole current population",
    {
      truncated: filmEffectRefusal(() => plan({ effects: effects.slice(0, 1) })),
      foreign: filmEffectRefusal(() =>
        plan({
          effects: [
            effects[0]!,
            resealFilmEffect(effects[1]!, (draft) => {
              draft.production = "other";
            }),
          ],
        }),
      ),
    },
    {
      truncated: "film-effect-runtime-invalid",
      foreign: "film-effect-runtime-stale",
    },
  );

  const scored: IAutoMovieFilmTimeline = timeline([CUE]);
  TestValidator.equals(
    "an audio cue must name its asset's exact sample count",
    {
      exact: plan({ timeline: scored, audioAssets: [stem(96_000)] }).tracks
        .audioAssets.length,
      short: throwsError(
        () => plan({ timeline: scored, audioAssets: [stem(95_999)] }),
        'Audio cue "cue"',
      ),
      missing: throwsError(
        () => plan({ timeline: scored, audioAssets: [] }),
        'Audio cue "cue"',
      ),
      unsourcedShot: throwsError(
        () => plan({ sourceFingerprints: {} }),
        'shot "shot" without one current builder-owned source fingerprint',
      ),
    },
    { exact: 1, short: true, missing: true, unsourcedShot: true },
  );
};
