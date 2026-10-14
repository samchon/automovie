import { resolveBeatEnd } from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

const motion: IAutoMovieMotion = {
  ...makeMotion([keyframe(0, makePose([])), keyframe(1, makePose([]))], 1),
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
  duration: 1,
};

/**
 * Beat-end resolution refuses duplicate motion ids instead of selecting an input-order winner.
 *
 * Scenarios:
 *
 * 1. Two supplied motions share walk but have different durations; resolution throws an Error naming the duplicate id and both source positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd with colliding motion identities and requires an Error naming walk and both input paths, detecting silent first- or last-write selection rather than a usable ambiguity report.
 * @evidence contracts/testing.md#independent-expectations The two literal walk ids occupy props.motions indices zero and one, so their identity collision and source paths need no sampling oracle; message fragments leave other error wording unconstrained.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts two durations under one id in an otherwise singular actor performance; unique motion lookup, missing motion and performed-versus-held actors belong to test_film_beat_end.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_end_duplicate_motion_ids entry owns one portable engine call and catches its Error directly, using existing authored motion records without a process, installation, native artifact or render host.
 */
export function test_film_beat_end_duplicate_motion_ids(): void {
  let thrown: unknown = null;
  try {
    resolveBeatEnd({
      beat: "beat-1",
      scene,
      shot,
      motions: [motion, { ...motion, duration: 2 }],
    });
  } catch (error) {
    thrown = error;
  }

  TestValidator.predicate(
    "duplicate motion ids throw",
    thrown instanceof Error,
  );
  TestValidator.equals(
    "duplicate motion id names both entries",
    namedFacts([
      ["thrownError", (): boolean => thrown instanceof Error],
      [
        "thrownMessageIncludes",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes('motion "walk" is duplicated'),
      ],
      [
        "thrownMessageIncludes2",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes("props.motions[0].id"),
      ],
      [
        "thrownMessageIncludes3",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes("props.motions[1].id"),
      ],
    ]),
    {
      thrownError: true,
      thrownMessageIncludes: true,
      thrownMessageIncludes2: true,
      thrownMessageIncludes3: true,
    },
  );
}
