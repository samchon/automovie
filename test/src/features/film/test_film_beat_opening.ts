import { resolveBeatEnd, resolveBeatOpening } from "@automovie/engine";
import {
  type IAutoMovieBeatEndActorState,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

/** A looping travel clip whose root advances x = 2t over a 1 s cycle. */
const walk: IAutoMovieMotion = {
  ...makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerLeg", { flexion: 0 })], {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(
        1,
        makePose([joint("leftLowerLeg", { flexion: 40 })], {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ],
    1,
    true,
  ),
  id: "walk",
};

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shot: IAutoMovieShot = {
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: "walk", startOffset: 0 }],
  objectMotions: [],
  duration: 0.5,
};

/**
 * `resolveBeatOpening` is the mirror of `resolveBeatEnd` at the shot's opening
 * instant (t = 0): where an actor stands and faces before any motion plays. The
 * continuity linter compares it against the previous beat's end-state, so it
 * must sample the clip at its start, not its end.
 *
 * Scenarios:
 *
 * 1. A hero performing the x = 2t walk from the staged origin opens at x = 0 (the
 *    clip's first frame) with gait phase 0, the walk clip named, and local time
 *    0.
 * 2. The same beat's end (duration 0.5) sits at x = 1.0, distinguishing the opening instant from the closing state.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatOpening and resolveBeatEnd for the same looping travel shot, checking opening position, phase, motion identity and local clock against a distinct closing position, detecting an opening wrapper that samples shot duration instead of zero.
 * @evidence contracts/testing.md#independent-expectations The authored root law x=2t gives zero at opening and one metre at the half-second cut; a one-second loop starts at phase zero and retains walk identity. Neither resolver supplies the expected scalar or vector values for the other.
 * @evidence contracts/testing.md#distinguishing-cases Owns the same-shot opening/end contrast with a positive half-cycle span and zero performance offset; carried prior-beat state, loop seams and missing or duplicate references have separate tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_opening entry owns both portable boundary calls with existing authored motion records, creating no installed consumer, native artifact, process, browser or GPU.
 */
export function test_film_beat_opening(): void {
  const opening: IAutoMovieBeatEndActorState = resolveBeatOpening({
    beat: "beat-1",
    scene,
    shot,
    motions: [walk],
  }).actors[0]!;
  TestValidator.predicate(
    "opening sits at the clip start (x = 0)",
    vclose(opening.transform.translation, { x: 0, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "opening gait phase is 0",
    nclose(opening.gaitPhase!, 0),
  );
  TestValidator.equals("opening names the walk clip", opening.motion, "walk");
  TestValidator.predicate(
    "opening local time is 0",
    nclose(opening.localTime, 0),
  );

  const end: IAutoMovieBeatEndActorState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot,
    motions: [walk],
  }).actors[0]!;
  TestValidator.predicate(
    "the beat end has advanced to x = 1.0, so opening != end",
    vclose(end.transform.translation, { x: 1, y: 0, z: 0 }),
  );
}
