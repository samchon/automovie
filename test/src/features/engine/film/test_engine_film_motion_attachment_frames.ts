import { AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame, AutoMovieEngineSequence, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieCompileAttach,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import {
  IDENTITY_TRANSFORM,
  createSkeleton,
  createValidMotion,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../internal/fixtures";

function observe(
  clip: IAutoMovieClip,
  seconds: number,
  expected: readonly number[],
): void {
  const point: number[] = AutoMovieEngineSequence.sampleClip(clip, seconds).get(
    "node:marker:translation",
  )!.value;
  assert.ok(
    point.every(
      (v: number, i: number): boolean => Math.abs(v - expected[i]!) <= 1e-9,
    ),
    JSON.stringify({ point, expected }),
  );
}
/**
 * 1. Place the parent a quarter turn from neutral and observe a resting marker in
 *    shot time.
 * 2. Flex the elbow and compare its marker to a rotating forearm, then compare a
 *    raw and clinical shoulder frame.
 * 3. Reject sampling clocks that cannot produce ordered finite keys.
 */
export function test_engine_film_motion_attachment_frames(): void {
  const args: IAutoMovieCompileAttach.IProps = {
    child: "marker",
    bone: "leftHand",
    parentSkeleton: createSkeleton(),
    parentTransform: {
      ...IDENTITY_TRANSFORM,
      translation: { x: 1, y: 0, z: 2 },
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    },
    start: 0.5,
    duration: 1,
    shotDuration: 3,
  };
  const rest: IAutoMovieClip = AutoMovieEngineFilm.compileAttach(args);
  assert.equal(rest.duration, args.shotDuration);
  for (const track of rest.tracks) {
    assert.equal(track.times[0], args.start);
    assert.equal(track.times.at(-1), args.start + args.duration);
  }
  observe(rest, args.start, [1, 1.4, 1.25]);
  observe(rest, args.start + args.duration, [1, 1.4, 1.25]);
  const q: number[] = AutoMovieEngineSequence.sampleClip(rest, args.start).get(
    "node:marker:rotation",
  )!.value;
  assert.ok(
    q.every(
      (v: number, i: number): boolean =>
        Math.abs(v - [0, Math.SQRT1_2, 0, Math.SQRT1_2][i]!) < 1e-9,
    ),
  );
  const moving: IAutoMovieClip = AutoMovieEngineFilm.compileAttach({
    ...args,
    start: 0,
    parentMotion: createValidMotion(),
    jointAxes: AutoMovieEngineHumanoidJointAxes,
    fps: 60,
  });
  const t: number = 2 / 3;
  const radians: number = (120 * t * Math.PI) / 180;
  observe(moving, t, [
    1 - 0.25 * Math.sin(radians),
    1.4,
    1.5 - 0.25 * Math.cos(radians),
  ]);
  const pose: IAutoMoviePose = makePose([
    joint("leftUpperArm", { abduction: 180 }),
  ]);
  const raised: IAutoMovieMotion = makeMotion(
    [keyframe(0, pose), keyframe(1, pose)],
    1,
  );
  const raw: IAutoMovieCompileAttach.IProps = {
    ...args,
    start: 0,
    parentMotion: raised,
    jointAxes: AutoMovieEngineHumanoidJointAxes,
  };
  observe(AutoMovieEngineFilm.compileAttach(raw), 0.5, [1, 1.4, 2.35]);
  observe(
    AutoMovieEngineFilm.compileAttach({ ...raw, restFrames: AutoMovieEngineHumanoidRestFrame }),
    0.5,
    [1, 1.95, 1.8],
  );
  assert.throws(() => AutoMovieEngineFilm.compileAttach({ ...args, duration: 0 }), /duration/);
  for (const fps of [0, -1])
    assert.throws(() => AutoMovieEngineFilm.compileAttach({ ...args, fps }), /fps|sample rate/i);
}
