import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { IAutoMoviePerformance, IAutoMoviePose, IAutoMovieMotion, IAutoMovieTrack, IAutoMovieCameraAction } from "@automovie/interface";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { TestValidator } from "@nestia/e2e";
import { makePerformanceWrite, makeScriptWrite, makeStagingWrite, validSynthesizer } from "../internal/filmFixtures";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";
const followFrame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "follow",
  on: { kind: "node", node: "knightA" },
};

const performance: (frame: IAutoMovieCameraAction) => IAutoMoviePerformance = (frame: IAutoMovieCameraAction): IAutoMoviePerformance =>
  makePerformanceWrite({
    draft: [
      {
        verb: "gesture",
        actor: "knightA",
        start: 0,
        duration: 1,
        kind: "wave",
      },
      frame,
    ],
    revise: { review: "unchanged.", final: null },
  });

/** A pose marching the root `x` m along **model** +X (arm poses along too). */
const march: (x: number) => IAutoMoviePose = (x: number): IAutoMoviePose =>
  makePose([joint("leftLowerArm", { flexion: 10 + x * 10 })], {
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

/** A clip whose root marches 1 m along model +X over 1 s. */
const marchSynth: () => IAutoMovieMotion = (): IAutoMovieMotion =>
  makeMotion([keyframe(0, march(0)), keyframe(1, march(1))], 1);

/**
 * Camera follow uses world displacement and keeps stationary/point subjects total.
 *
 * Scenarios:
 * 1. Follow a one-metre model-X root march and keep the rootless neighbour's endpoint X coordinate unchanged.
 * 2. Produce one static key for a point subject.
 * 3. Rotate the same march by staged +90-degree facing and check zero X drift and minus-one Z travel.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot and reads camera translation keys, catching ignored root X travel, a node-local/world-frame mix, rootless endpoint X drift or a static-point path with more than one key. It does not compare every rootless coordinate or interior key.
 * @evidence contracts/testing.md#independent-expectations The authored one-metre X translation fixes X displacement; a +90-degree Y placement maps it to world minus-Z, and the rootless fixture requires equal endpoint X coordinates. nclose compares hand-derived displacement rather than the framing solver's output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes translated root, rootless clip, static point and turned placement with the same numerical path; camera-subject and bone/projectile follow cases are owned by camera_subject.
 * @evidence contracts/testing.md#execution-ownership This portable discoverable unit owns its camera compilation cases and reads arrays only, starting no browser, viewer or GPU. Numerical camera keys prove no final framing appearance.
 */
export function test_film_perform_shot_camera_follow(): void {
  const staged: IAutoMovieStagedSet = stageScene(makeScriptWrite(), makeStagingWrite());
  if (staged.success !== true) throw new Error("staging must succeed");

  const marching: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: performance(followFrame),
    synthesize: marchSynth,
    skeleton: (): null => null,
  });
  TestValidator.equals("marching succeeds", marching.success, true);
  if (marching.success !== true) return;
  const track: IAutoMovieTrack = marching.shot.cameraMotion!.tracks[0]!;
  const first: number = track.values[0]!;
  const last: number = track.values[track.values.length - 3]!;
  TestValidator.predicate(
    "camera followed the root displacement",
    nclose(last - first, 1, 1e-6),
  );

  const rootless: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: performance(followFrame),
    synthesize: validSynthesizer,
    skeleton: (): null => null,
  });
  TestValidator.equals("rootless succeeds", rootless.success, true);
  if (rootless.success === true) {
    const t: IAutoMovieTrack = rootless.shot.cameraMotion!.tracks[0]!;
    TestValidator.predicate(
      "rootless follow keeps its endpoint X coordinate",
      nclose(t.values[0]!, t.values[t.values.length - 3]!, 1e-9),
    );
  }

  const pointed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: performance({
      ...followFrame,
      move: "static",
      on: { kind: "point", point: { x: 0, y: 0, z: 0.35 } },
    }),
    synthesize: validSynthesizer,
    skeleton: (): null => null,
  });
  TestValidator.equals("pointed succeeds", pointed.success, true);
  if (pointed.success === true)
    TestValidator.equals(
      "point subject locks a single key",
      pointed.shot.cameraMotion!.tracks[0]!.times.length,
      1,
    );

  // 4. the followed actor is staged turned (+90°): its root is node-local, so a
  // model +X march renders as a world −Z path. The camera must follow that
  // world path (no X drift, ≈−1 in Z), not the un-rotated model root.
  const turnedStaged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 90 },
        { node: "knightB", position: { x: 0, y: 0, z: 0.7 }, facingDeg: 180 },
      ],
    }),
  );
  if (turnedStaged.success !== true) throw new Error("staging must succeed");
  const turned: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged: turnedStaged,
    performance: performance(followFrame),
    synthesize: marchSynth,
    skeleton: (): null => null,
  });
  TestValidator.equals("turned follow succeeds", turned.success, true);
  if (turned.success === true) {
    const tr: IAutoMovieTrack = turned.shot.cameraMotion!.tracks[0]!;
    const n: number = tr.values.length;
    TestValidator.predicate(
      "a +X model march under +90° facing renders as a world −Z follow",
      nclose(tr.values[n - 3]! - tr.values[0]!, 0, 1e-6) &&
        nclose(tr.values[n - 1]! - tr.values[2]!, -1, 1e-6),
    );
  }
}
