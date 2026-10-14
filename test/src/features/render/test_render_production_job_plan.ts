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
import { throwsError } from "../internal/predicates";
import { GRAPHICS_FIXTURE } from "../internal/renderBudgetFixtures";

const SHOT_DIGEST: `sha256:${string}` = `sha256:${"e".repeat(64)}` as const;

/** The 48-frame, 24 fps effect fixture film, owned by production `production`. */
const timeline: (
  audio?: IAutoMovieFilmTimeline["tracks"]["audio"],
) => IAutoMovieFilmTimeline = (
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
const production: (
  deliverables?: IAutoMovieProductionDesign["deliverables"],
) => IAutoMovieProductionDesign = (
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

const runtimeIdentity: () => IAutoMovieProductionRenderRuntimeIdentity =
  (): IAutoMovieProductionRenderRuntimeIdentity => ({
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
const stem: (sourceFrames: number) => IAutoMovieProductionAudioAssetIdentity = (
  sourceFrames: number,
): IAutoMovieProductionAudioAssetIdentity => ({
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

const plan: (
  overrides?: Partial<IPlanProps>,
) => IAutoMovieProductionRenderJobPlan = (
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real render planner and checks exact final/proxy ranges, frame/layer membership, stable distinct chunk identities, legacy guide-pass selection and effect/audio/source-identity refusals.
 * @evidence contracts/testing.md#independent-expectations Forty-eight source frames split into 20/20/8 final chunks or 20/4 proxy chunks; factor-two raster/time sampling and 48000-Hz stereo sample counts supply independent arithmetic. Repeated ids test determinism rather than independently specifying digest bytes.
 * @evidence contracts/testing.md#distinguishing-cases Final/proxy, feature/guide/caption, explicit/default/conflicting legacy passes, complete/truncated/foreign effects, exact/short/missing audio and absent shot fingerprint preserve both admitted and refused boundaries.
 * @evidence contracts/testing.md#execution-ownership The named portable synchronous unit owns all planner cases through supplied numerical timelines and runtime-identity records; no browser, encoder, native media asset, process or production workspace is opened.
 */
export function test_render_production_job_plan(): void {
  const final: IAutoMovieProductionRenderJobPlan = plan();
  TestValidator.equals(
    "a final plan partitions both moving deliverables into the same ranges",
    {
      totalFrames: final.totalFrames,
      chunks: final.chunks.map((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): { slot: string; kind: typeof chunk.kind; pass: typeof chunk.pass; range: number[]; frames: number } => ({
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
      ].map(([deliverable, kind, pass, index, start, end]: (string | number)[]): { slot: string; kind: "feature" | "guide-pass"; pass: "beauty" | "depth"; range: number[]; frames: number } => ({
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
    final.chunks.every((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): boolean =>
      chunk.frames.every((frame: typeof chunk.frames[number]): boolean =>
        frame.layers.every((layer: typeof frame.layers[number]): boolean => layer.shot === "shot"),
      ),
    ),
    true,
  );
  TestValidator.equals(
    "ids are distinct per deliverable and range and stable across plans",
    {
      distinct: new Set(final.chunks.map((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): string => chunk.id)).size,
      repeated: plan().chunks.map((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): string => chunk.id),
    },
    { distinct: 6, repeated: final.chunks.map((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): string => chunk.id) },
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
        .filter((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): boolean => chunk.kind === "feature")
        .map((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): number[] => [chunk.frameStart, chunk.frameEndExclusive]),
      timelineFrames: proxy.chunks[0]!.frames.slice(0, 3).map((frame: IAutoMovieProductionRenderJobPlan["chunks"][number]["frames"][number]): number[] => [
        frame.globalFrame,
        frame.timelineFrame,
      ]),
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
        (): IAutoMovieProductionRenderJobPlan => plan({ production: legacy, guidePasses: ["normal", "mask"] }),
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
      truncated: filmEffectRefusal((): IAutoMovieProductionRenderJobPlan =>
        plan({ effects: effects.slice(0, 1) }),
      ),
      foreign: filmEffectRefusal((): IAutoMovieProductionRenderJobPlan =>
        plan({
          effects: [
            effects[0]!,
            resealFilmEffect(effects[1]!, (draft: Parameters<Parameters<typeof resealFilmEffect>[1]>[0]): void => {
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
        (): IAutoMovieProductionRenderJobPlan => plan({ timeline: scored, audioAssets: [stem(95_999)] }),
        'Audio cue "cue"',
      ),
      missing: throwsError(
        (): IAutoMovieProductionRenderJobPlan => plan({ timeline: scored, audioAssets: [] }),
        'Audio cue "cue"',
      ),
      unsourcedShot: throwsError(
        (): IAutoMovieProductionRenderJobPlan => plan({ sourceFingerprints: {} }),
        'shot "shot" without one current builder-owned source fingerprint',
      ),
    },
    { exact: 1, short: true, missing: true, unsourcedShot: true },
  );
}
