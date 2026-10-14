import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { IAutoMovieSequenceRenderFrame } from "../../../../packages/render/src/IAutoMovieSequenceRenderFrame";
import { IAutoMovieSequenceRenderShotSpan } from "../../../../packages/render/src/IAutoMovieSequenceRenderShotSpan";
import { IAutoMovieSequenceRenderPlan } from "../../../../packages/render/src/IAutoMovieSequenceRenderPlan";
import { IAutoMovieTrim, IAutoMovieRenderSpec, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { planSequenceRender } from "../../../../packages/render/src/planSequenceRender";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose, throwsError } from "../internal/predicates";
const shot: (id: string, duration: number) => IAutoMovieShot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

const SHOTS: IAutoMovieShot[] = [shot("shot:a", 2), shot("shot:b", 3)];

const SEQUENCE: IAutoMovieSequence = {
  id: "seq:duel",
  name: "duel",
  fps: 24,
  shots: [
    {
      shot: "shot:a",
      trim: { start: 0.5, duration: 1 },
      transition: null,
    },
    {
      shot: "shot:b",
      trim: { start: 1, duration: 2 },
      transition: { kind: "crossDissolve", duration: 0.5 },
    },
  ],
};

const SPEC: IAutoMovieRenderSpec = {
  target: SEQUENCE.id,
  frameFormat: { fps: 4, width: 640, height: 360 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 20,
};

/**
 * The sequence render manifest exposes the same cut arithmetic the viewer uses: trim offsets, transition overlap, per-frame live shot samples, blend tails, and encoder paths.
 *
 * Scenarios:
 *
 * 1. A two-shot sequence with a 0.5 s dissolve has a 2.5 s runtime and 10 frames at render fps 4.
 * 2. Shot spans preserve trim offsets; the incoming entry starts at 0.5 s because the transition overlaps the previous shot tail.
 * 3. Frames inside the dissolve carry both incoming and outgoing shot-local times plus the incoming alpha.
 * 4. Default frame/output paths sanitize the sequence id and produce pinned ffmpeg args; custom paths override those defaults.
 * 5. Target mismatch and zero-frame schedules reject before capture.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans the actual two-shot cut and observes spans, trim offsets, blend samples, paths and target/zero-frame refusals, detecting incorrect overlap or output-clock mapping.
 * @evidence contracts/testing.md#independent-expectations One plus two seconds minus a half-second dissolve gives 2.5 seconds and ten frames at four fps; incoming start 0.5 and halfway alpha 0.5 follow hand cut arithmetic. Numeric records use nclose, and argument/path checks observe planning rather than encoding.
 * @evidence contracts/testing.md#distinguishing-cases Boundary entry, midway dissolve and past-dissolve samples, default/custom paths, target mismatch and too-short runtime preserve the original branches; actual capture/encoder delegation belongs to sequence_video.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_sequence_plan owns its cases. Portable timeline and manifest construction, with no frame capture, ffmpeg process or file output.
 */
export function test_render_sequence_plan(): void {
  const plan: IAutoMovieSequenceRenderPlan = planSequenceRender({
    sequence: SEQUENCE,
    shots: SHOTS,
    spec: SPEC,
  });

  // 1. runtime + frames
  TestValidator.equals("target", plan.target, {
    kind: "sequence",
    id: SEQUENCE.id,
  });
  TestValidator.predicate("sequence fps", nclose(plan.sequenceFps, 24, 1e-12));
  TestValidator.predicate("render fps", nclose(plan.renderFps, 4, 1e-12));
  TestValidator.predicate("duration", nclose(plan.durationSeconds, 2.5));
  TestValidator.equals("frame count", plan.frameCount, 10);
  TestValidator.predicate(
    "times ride render fps",
    plan.times.every((time: number, i: number): boolean => nclose(time, i / 4)),
  );

  // 2. shot spans + transition span
  TestValidator.predicate("shot spans", filmEffectValuesClose(plan.shots.map((span: IAutoMovieSequenceRenderShotSpan): { shot: string; start: number; end: number; played: number; offset: number; trim: IAutoMovieTrim | null; } => ({
      shot: span.shot,
      start: span.start,
      end: span.end,
      played: span.played,
      offset: span.offset,
      trim: span.trim,
    })), [
      {
        shot: "shot:a",
        start: 0,
        end: 1,
        played: 1,
        offset: 0.5,
        trim: { start: 0.5, duration: 1 },
      },
      {
        shot: "shot:b",
        start: 0.5,
        end: 2.5,
        played: 2,
        offset: 1,
        trim: { start: 1, duration: 2 },
      },
    ]));
  TestValidator.predicate("transition span", filmEffectValuesClose(plan.transitionSpans, [
    {
      entry: 1,
      from: "shot:a",
      to: "shot:b",
      kind: "crossDissolve",
      start: 0.5,
      end: 1,
      duration: 0.5,
    },
  ]));

  // 3. frame samples
  TestValidator.predicate("first frame", filmEffectValuesClose(plan.frames[0], {
    index: 0,
    timeSeconds: 0,
    path: "frames/seq_duel/frame_00000.png",
    shot: "shot:a",
    shotTimeSeconds: 0.5,
    blend: null,
  }));
  TestValidator.predicate("dissolve entry frame", filmEffectValuesClose(plan.frames[2], {
    index: 2,
    timeSeconds: 0.5,
    path: "frames/seq_duel/frame_00002.png",
    shot: "shot:b",
    shotTimeSeconds: 1,
    blend: { shot: "shot:a", shotTimeSeconds: 1, alpha: 0 },
  }));
  const midDissolve: IAutoMovieSequenceRenderFrame = plan.frames[3]!;
  TestValidator.equals(
    "mid dissolve sample",
    namedFacts([
      ["midDissolveShotShot", (): boolean => midDissolve.shot === "shot:b"],
      [
        "ncloseMidDissolveTimeSeconds",
        (): boolean => nclose(midDissolve.timeSeconds, 0.75),
      ],
      [
        "ncloseMidDissolveShotTimeSeconds",
        (): boolean => nclose(midDissolve.shotTimeSeconds, 1.25),
      ],
      ["midDissolveBlend", (): boolean => midDissolve.blend !== null],
      [
        "midDissolveBlendShot",
        (): boolean => midDissolve.blend !== null && midDissolve.blend.shot === "shot:a",
      ],
      [
        "ncloseMidDissolveBlend",
        (): boolean =>
          midDissolve.blend !== null &&
          nclose(midDissolve.blend.shotTimeSeconds, 1.25),
      ],
      [
        "ncloseMidDissolveBlend2",
        (): boolean =>
          midDissolve.blend !== null && nclose(midDissolve.blend.alpha, 0.5),
      ],
    ]),
    {
      midDissolveShotShot: true,
      ncloseMidDissolveTimeSeconds: true,
      ncloseMidDissolveShotTimeSeconds: true,
      midDissolveBlend: true,
      midDissolveBlendShot: true,
      ncloseMidDissolveBlend: true,
      ncloseMidDissolveBlend2: true,
    },
  );
  TestValidator.equals("past dissolve", plan.frames[4]!.blend, null);

  // 4. paths + ffmpeg args
  TestValidator.equals(
    "first frame path",
    plan.firstFrame,
    plan.frames[0]!.path,
  );
  TestValidator.equals("last frame path", plan.lastFrame, plan.frames[9]!.path);
  TestValidator.equals(
    "input pattern",
    plan.inputPattern,
    "frames/seq_duel/frame_%05d.png",
  );
  TestValidator.equals("default output", plan.outputPath, "seq_duel.mp4");
  TestValidator.equals(
    "ffmpeg args include manifest paths",
    namedFacts([
      [
        "planFfmpegArgsIncludes",
        (): boolean => plan.ffmpegArgs.includes("frames/seq_duel/frame_%05d.png"),
      ],
      [
        "planFfmpegArgsIncludes2",
        (): boolean => plan.ffmpegArgs.includes("seq_duel.mp4"),
      ],
    ]),
    { planFfmpegArgsIncludes: true, planFfmpegArgsIncludes2: true },
  );

  const custom: IAutoMovieSequenceRenderPlan = planSequenceRender({
    sequence: SEQUENCE,
    shots: SHOTS,
    spec: SPEC,
    frameDir: "custom/frames",
    outputPath: "custom/out.mp4",
  });
  TestValidator.equals(
    "custom first frame",
    custom.firstFrame,
    "custom/frames/frame_00000.png",
  );
  TestValidator.equals("custom output", custom.outputPath, "custom/out.mp4");

  // 5. guards
  TestValidator.predicate(
    "target mismatch rejects",
    throwsError(
      (): IAutoMovieSequenceRenderPlan =>
        planSequenceRender({
          sequence: SEQUENCE,
          shots: SHOTS,
          spec: { ...SPEC, target: "shot:a" },
        }),
      ["target", "shot:a", SEQUENCE.id],
    ),
  );
  TestValidator.predicate(
    "zero-frame schedule rejects",
    throwsError(
      (): IAutoMovieSequenceRenderPlan =>
        planSequenceRender({
          sequence: {
            ...SEQUENCE,
            shots: [
              {
                shot: "shot:a",
                trim: { start: 0, duration: 0.01 },
                transition: null,
              },
            ],
          },
          shots: SHOTS,
          spec: {
            ...SPEC,
            frameFormat: { ...SPEC.frameFormat, fps: 1 },
          },
        }),
      ["planSequenceRender", "at least one frame", "produced zero frames"],
    ),
  );
}
