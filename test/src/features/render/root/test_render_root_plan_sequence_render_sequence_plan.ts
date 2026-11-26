import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  type IAutoMovieSequenceRenderFrame,
  type IAutoMovieSequenceRenderPlan,
  type IAutoMovieSequenceRenderShotSpan,
  type IAutoMovieSequenceRenderTransitionSpan,
  IAutoMovieShot,
} from "@automovie/interface";
import { AutoMovieRenderSequence } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../../internal/predicates";

/** All clock inputs and expected samples in the scenario are exact binary fractions. */
const CLOCK_TOLERANCE: number = 0;

const shot: (id: string, duration: number) => IAutoMovieShot = (
  id: string,
  duration: number,
): IAutoMovieShot => ({
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
 * The sequence render manifest exposes the same cut arithmetic the viewer uses:
 * trim offsets, transition overlap, per-frame live shot samples, blend tails,
 * and encoder paths.
 *
 * Scenarios:
 *
 * 1. A two-shot sequence with a 0.5 s dissolve has a 2.5 s runtime and 10 frames
 *    at render fps 4.
 * 2. Shot spans preserve trim offsets; the incoming entry starts at 0.5 s because
 *    the transition overlaps the previous shot tail.
 * 3. Frames inside the dissolve carry both incoming and outgoing shot-local times
 *    plus the transition's progress and kind.
 * 4. Default frame/output paths sanitize the sequence id and produce pinned ffmpeg
 *    args; custom paths override those defaults.
 * 5. Target mismatch and zero-frame schedules reject before capture.
 */
export function test_render_root_plan_sequence_render_sequence_plan(): void {
  const plan: IAutoMovieSequenceRenderPlan = AutoMovieRenderSequence.plan({
    sequence: SEQUENCE,
    shots: SHOTS,
    spec: SPEC,
  });

  // 1. runtime + frames
  TestValidator.equals("target", plan.target, {
    kind: "sequence",
    id: SEQUENCE.id,
  });
  TestValidator.equals("sequence fps", plan.sequenceFps, 24);
  TestValidator.equals("render fps", plan.renderFps, 4);
  TestValidator.predicate("duration", nclose(plan.durationSeconds, 2.5, CLOCK_TOLERANCE));
  TestValidator.equals("frame count", plan.frameCount, 10);
  TestValidator.predicate(
    "times ride render fps",
    plan.times.length === 10 &&
      plan.times.every((time: number, i: number): boolean => nclose(time, i / 4, CLOCK_TOLERANCE)),
  );

  // 2. shot spans + transition span
  TestValidator.equals("shot count", plan.shots.length, 2);
  const firstSpan: IAutoMovieSequenceRenderShotSpan = plan.shots[0]!;
  const secondSpan: IAutoMovieSequenceRenderShotSpan = plan.shots[1]!;
  TestValidator.equals("shot order", [firstSpan.shot, secondSpan.shot], ["shot:a", "shot:b"]);
  TestValidator.predicate("first shot span", firstSpan.trim !== null &&
    nclose(firstSpan.start, 0, CLOCK_TOLERANCE) &&
    nclose(firstSpan.end, 1, CLOCK_TOLERANCE) &&
    nclose(firstSpan.played, 1, CLOCK_TOLERANCE) &&
    nclose(firstSpan.offset, 0.5, CLOCK_TOLERANCE) &&
    nclose(firstSpan.trim.start, 0.5, CLOCK_TOLERANCE) &&
    nclose(firstSpan.trim.duration, 1, CLOCK_TOLERANCE));
  TestValidator.predicate("second shot span", secondSpan.trim !== null &&
    nclose(secondSpan.start, 0.5, CLOCK_TOLERANCE) &&
    nclose(secondSpan.end, 2.5, CLOCK_TOLERANCE) &&
    nclose(secondSpan.played, 2, CLOCK_TOLERANCE) &&
    nclose(secondSpan.offset, 1, CLOCK_TOLERANCE) &&
    nclose(secondSpan.trim.start, 1, CLOCK_TOLERANCE) &&
    nclose(secondSpan.trim.duration, 2, CLOCK_TOLERANCE));

  TestValidator.equals("transition count", plan.transitionSpans.length, 1);
  const transition: IAutoMovieSequenceRenderTransitionSpan = plan.transitionSpans[0]!;
  TestValidator.equals("transition identity", [transition.entry, transition.from, transition.to, transition.kind],
    [1, "shot:a", "shot:b", "crossDissolve"]);
  TestValidator.predicate("transition span",
    nclose(transition.start, 0.5, CLOCK_TOLERANCE) &&
    nclose(transition.end, 1, CLOCK_TOLERANCE) &&
    nclose(transition.duration, 0.5, CLOCK_TOLERANCE));

  // 3. frame samples
  const firstFrame: IAutoMovieSequenceRenderFrame = plan.frames[0]!;
  TestValidator.equals("first frame identity", [firstFrame.index, firstFrame.path, firstFrame.shot, firstFrame.blend],
    [0, "frames/seq_duel/frame_00000.png", "shot:a", null]);
  TestValidator.predicate("first frame times",
    nclose(firstFrame.timeSeconds, 0, CLOCK_TOLERANCE) &&
    nclose(firstFrame.shotTimeSeconds, 0.5, CLOCK_TOLERANCE));

  const dissolveEntry: IAutoMovieSequenceRenderFrame = plan.frames[2]!;
  TestValidator.equals("dissolve entry identity", [dissolveEntry.index, dissolveEntry.path, dissolveEntry.shot, dissolveEntry.blend?.shot, dissolveEntry.blend?.kind],
    [2, "frames/seq_duel/frame_00002.png", "shot:b", "shot:a", "crossDissolve"]);
  TestValidator.predicate("dissolve entry times and blend", dissolveEntry.blend !== null &&
    nclose(dissolveEntry.timeSeconds, 0.5, CLOCK_TOLERANCE) &&
    nclose(dissolveEntry.shotTimeSeconds, 1, CLOCK_TOLERANCE) &&
    nclose(dissolveEntry.blend.shotTimeSeconds, 1, CLOCK_TOLERANCE) &&
    nclose(dissolveEntry.blend.alpha, 0, CLOCK_TOLERANCE));
  const midDissolve: IAutoMovieSequenceRenderFrame = plan.frames[3]!;
  TestValidator.equals(
    "mid dissolve sample",
    namedFacts([
      ["midDissolveShotShot", (): boolean => midDissolve.shot === "shot:b"],
      [
        "ncloseMidDissolveTimeSeconds",
        (): boolean => nclose(midDissolve.timeSeconds, 0.75, CLOCK_TOLERANCE),
      ],
      [
        "ncloseMidDissolveShotTimeSeconds",
        (): boolean => nclose(midDissolve.shotTimeSeconds, 1.25, CLOCK_TOLERANCE),
      ],
      ["midDissolveBlend", (): boolean => midDissolve.blend !== null],
      [
        "midDissolveBlendShot",
        (): boolean =>
          midDissolve.blend !== null && midDissolve.blend.shot === "shot:a",
      ],
      [
        "ncloseMidDissolveBlend",
        (): boolean =>
          midDissolve.blend !== null &&
          nclose(midDissolve.blend.shotTimeSeconds, 1.25, CLOCK_TOLERANCE),
      ],
      [
        "ncloseMidDissolveBlend2",
        (): boolean =>
          midDissolve.blend !== null && nclose(midDissolve.blend.alpha, 0.5, CLOCK_TOLERANCE),
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
        (): boolean =>
          plan.ffmpegArgs.includes("frames/seq_duel/frame_%05d.png"),
      ],
      [
        "planFfmpegArgsIncludes2",
        (): boolean => plan.ffmpegArgs.includes("seq_duel.mp4"),
      ],
    ]),
    { planFfmpegArgsIncludes: true, planFfmpegArgsIncludes2: true },
  );

  const custom: IAutoMovieSequenceRenderPlan = AutoMovieRenderSequence.plan({
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
        AutoMovieRenderSequence.plan({
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
        AutoMovieRenderSequence.plan({
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
