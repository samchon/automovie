import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMovieResolveBeatProps,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../../internal/fixtures";
import { throwsError } from "../../internal/predicates";

/**
 * `resolveBeatSnapshot` indexes a beat's motions by id and refuses a repeated
 * id.
 *
 * Fixture: an empty studio scene, a one-second shot, and motions "first" and
 * "second" (each one empty keyframe).
 *
 * Scenarios:
 *
 * 1. Two distinct motions resolve at the beat's start without error.
 * 2. A third motion repeating the id "first" is refused naming `motion "first" is
 *    duplicated`, the repeat's location `props.motions[2].id` and the first at
 *    `props.motions[0].id`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the two admitted motion IDs and the denied duplicate with both source positions.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls resolveBeatSnapshot at the start with two distinct motion records. It appends one duplicate and compares the addressed refusal.
 * @evidence contracts/development/testing.md#independent-expectations The titles first and second are distinct literal keys. Adding another first at index two conflicts with the first declaration at index zero, which determines both expected addresses.
 */
export function test_engine_film_beat_snapshot(): void {
  const first: IAutoMovieMotion = {
    ...makeMotion([keyframe(0, makePose([]))], 1),
    id: "first",
  };
  const second: IAutoMovieMotion = { ...first, id: "second" };
  const props: IAutoMovieResolveBeatProps = {
    beat: "cut",
    scene: { id: "studio", name: null, nodes: [], cameras: [], lights: [] },
    shot: {
      id: "shot",
      name: null,
      scene: "studio",
      camera: "camera",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 1,
    },
    motions: [first, second],
  };
  AutoMovieEngineFilm.resolveBeatSnapshot(props, 0);
  TestValidator.predicate(
    "duplicate",
    throwsError(
      () =>
        AutoMovieEngineFilm.resolveBeatSnapshot(
          { ...props, motions: [first, second, { ...first, duration: 2 }] },
          0,
        ),
      [
        'motion "first" is duplicated',
        "props.motions[2].id",
        "props.motions[0].id",
      ],
    ),
  );
}
