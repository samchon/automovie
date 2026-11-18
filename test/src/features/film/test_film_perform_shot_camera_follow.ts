import { Quaternion, performShot, stageScene } from "@automovie/engine";
import {
  IAutoMovieCameraAction,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  type IAutoMoviePerformedShot,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  type IAutoMovieStagedSet,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { hasViolation, nclose, qclose } from "../internal/predicates";

const followFrame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "follow",
  on: { kind: "node", node: "knightA" },
};

const performance: (frame: IAutoMovieCameraAction) => IAutoMoviePerformance = (
  frame: IAutoMovieCameraAction,
): IAutoMoviePerformance =>
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
 * 4. Aim half a second ahead of the march while matching every base translation key and converging to the base aim at the shot end.
 * 5. Refuse negative and infinite lookahead and an authored lookahead on a static move.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs performShot and reads camera translation keys, catching ignored root X travel, a node-local/world-frame mix, rootless endpoint X drift or a static-point path with more than one key. Lookahead additionally checks executed rotation, translation and located gate refusals. It does not compare every rootless coordinate or interior key.
 * @evidence contracts/development/testing.md#independent-expectations The authored one-metre X translation fixes X displacement; a +90-degree Y placement maps it to world minus-Z, and the rootless fixture requires equal endpoint X coordinates. The opening lookahead ray must cross the subject's world Z=0 plane at X=0.5; the shot end has no future displacement and must retain the ordinary aim. The translation comparison isolates the effect of changing lookahead.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes translated root, rootless clip, static point and turned placement with the same numerical path; lookahead distinguishes current translation from future aim, and separates admissible follow from invalid values and other moves. Camera-subject and bone/projectile follow cases are owned by camera_subject.
 * @evidence contracts/development/testing.md#execution-ownership This portable discoverable unit owns its camera compilation cases and reads arrays only, starting no browser, viewer or GPU. Numerical camera keys prove no final framing appearance.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Follow a one-metre model-X root march and keep the rootless neighbour's endpoint X coordinate unchanged.).
 */
export function test_film_perform_shot_camera_follow(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
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

  const ahead: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: performance({ ...followFrame, lookahead: 0.5 }),
    synthesize: marchSynth,
    skeleton: (): null => null,
  });
  TestValidator.equals("lookahead succeeds", ahead.success, true);
  if (ahead.success === true) {
    const [translation, rotation]: IAutoMovieTrack[] =
      ahead.shot.cameraMotion!.tracks;
    const baseRotation: IAutoMovieTrack =
      marching.shot.cameraMotion!.tracks[1]!;
    TestValidator.predicate(
      "lookahead keeps the current-position translation keys",
      translation!.times.length === track.times.length &&
        translation!.times.every((time: number, index: number): boolean =>
          nclose(time, track.times[index]!, 1e-9),
        ) &&
        translation!.values.length === track.values.length &&
        translation!.values.every((value: number, index: number): boolean =>
          nclose(value, track.values[index]!, 1e-9),
        ),
    );

    /** Read one world rotation from a camera rotation track. */
    function rotationAt(
      tr: IAutoMovieTrack,
      offset: number,
    ): IAutoMovieQuaternion {
      return {
        x: tr.values[offset]!,
        y: tr.values[offset + 1]!,
        z: tr.values[offset + 2]!,
        w: tr.values[offset + 3]!,
      };
    }

    const aheadAim: IAutoMovieVector3 = Quaternion.rotateVector(
      rotationAt(rotation!, 0),
      { x: 0, y: 0, z: -1 },
    );
    const toSubjectPlane: number = -translation!.values[2]! / aheadAim.z;
    TestValidator.predicate(
      "opening camera ray hits the subject plane half a metre ahead",
      toSubjectPlane > 0 &&
        nclose(
          translation!.values[0]! + toSubjectPlane * aheadAim.x,
          0.5,
          1e-6,
        ),
    );
    TestValidator.predicate(
      "shot-end lookahead uses the current aim",
      qclose(
        rotationAt(rotation!, rotation!.values.length - 4),
        rotationAt(baseRotation, baseRotation.values.length - 4),
      ),
    );
  }

  TestValidator.predicate(
    "invalid lookahead is refused at its authored field",
    (
      [
        { move: "follow", lookahead: -1 },
        { move: "follow", lookahead: Infinity },
        { move: "static", lookahead: 0 },
      ] satisfies Partial<IAutoMovieCameraAction>[]
    ).every((overrides: Partial<IAutoMovieCameraAction>): boolean => {
      const result: IAutoMoviePerformedShot = performShot({
        script: makeScriptWrite(),
        staged,
        performance: performance({ ...followFrame, ...overrides }),
        synthesize: marchSynth,
        skeleton: (): null => null,
      });
      return (
        result.success === false &&
        hasViolation(
          result,
          overrides.move === "static" ? "type" : "range",
          "$input.draft[1].lookahead",
        )
      );
    }),
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
