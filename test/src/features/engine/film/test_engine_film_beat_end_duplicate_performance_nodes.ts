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
} from "../../internal/fixtures";
import { namedFacts } from "../../internal/predicates";

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
 * Beat-end resolution refuses duplicate performance nodes instead of choosing
 * between performed and held state by input order.
 *
 * Scenarios:
 *
 * 1. A walk performance and a held performance both target hero; resolution throws
 *    an Error naming the duplicate node and both performance source positions.
 */
export function test_engine_film_beat_end_duplicate_performance_nodes(): void {
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
