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
  performances: [
    { node: "hero", motion: "walk", startOffset: 0 },
    { node: "hero", motion: null, startOffset: 0 },
  ],
  objectMotions: [],
  duration: 1,
};

/**
 * Beat-end resolution refuses duplicate performance nodes instead of choosing between performed and held state by input order.
 *
 * Scenarios:
 *
 * 1. A walk performance and a held performance both target hero; resolution throws an Error naming the duplicate node and both performance source positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd with conflicting performed and held entries for hero and requires the duplicate Error and both owning paths, catching input-order selection instead of refusal of ambiguous actor state.
 * @evidence contracts/testing.md#independent-expectations The literal performances share hero at indices zero and one while requesting different motion states, so their collision and source paths follow directly from the input rather than a sampled end state.
 * @evidence contracts/testing.md#distinguishing-cases Owns duplicate performance identity with a real supplied walk motion and one staged node; distinct actors, held actors and missing motion lookup belong to the ordinary beat-end tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_end_duplicate_performance_nodes entry owns one in-process refusal, catches its Error without replacing a global or foreign method, and creates no consumer installation, native artifact or real host.
 */
export function test_film_beat_end_duplicate_performance_nodes(): void {
  let thrown: unknown = null;
  try {
    resolveBeatEnd({
      beat: "beat-1",
      scene,
      shot,
      motions: [motion],
    });
  } catch (error) {
    thrown = error;
  }

  TestValidator.predicate(
    "duplicate performance nodes throw",
    thrown instanceof Error,
  );
  TestValidator.equals(
    "duplicate performance node names both entries",
    namedFacts([
      ["thrownError", (): boolean => thrown instanceof Error],
      [
        "thrownMessageIncludes",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes('performance for node "hero" is duplicated'),
      ],
      [
        "thrownMessageIncludes2",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes("props.shot.performances[0].node"),
      ],
      [
        "thrownMessageIncludes3",
        (): boolean =>
          thrown instanceof Error &&
          thrown.message.includes("props.shot.performances[1].node"),
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
