import { validateFilmContinuity } from "@automovie/engine";
import {
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
import {
  hasViolation,
  validationHasNoWarnings,
  validationHasWarning,
} from "../internal/predicates";

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

/**
 * A beat whose hero is staged at `stagedX` and walks for `duration` seconds. A
 * 0.5 s beat advances the hero one metre (x = 2t), so its END is `stagedX + 1`
 * and its OPENING is `stagedX`.
 */
const beatProps: (
  beat: string,
  stagedX: number,
  duration: number,
) => Parameters<typeof validateFilmContinuity>[0]["beats"][number] = (
  beat: string,
  stagedX: number,
  duration: number,
): Parameters<typeof validateFilmContinuity>[0]["beats"][number] => {
  const scene: IAutoMovieScene = {
    id: "scene",
    name: null,
    nodes: [
      {
        id: "hero",
        model: "hero",
        transform: {
          ...IDENTITY_TRANSFORM,
          translation: { x: stagedX, y: 0, z: 0 },
        },
        motion: null,
        pose: null,
      },
    ],
    cameras: [],
    lights: [],
  };
  const shot: IAutoMovieShot = {
    id: `shot:${beat}`,
    name: null,
    scene: "scene",
    camera: "cam",
    cameraMotion: null,
    performances: [{ node: "hero", motion: "walk", startOffset: 0 }],
    objectMotions: [],
    duration,
  };
  return { beat, scene, shot, motions: [walk] };
};

/**
 * The whole-film continuity linter (#1172): walk the film in playback order and
 * compare each beat's opening against the previous beat's end. This audit
 * reads the supplied scenes as authored; it does not resume or restage them.
 * A hero staged back at the origin instead of where it walked to therefore
 * produces an advisory warning. Invalid tolerance remains an admission error.
 *
 * Scenarios:
 *
 * 1. An empty film and a single-beat film have no cut to lint and pass with no
 *    warnings (the pairwise loop never runs).
 * 2. Two beats where the second is staged where the first ended (x = 1) resume
 *    cleanly: no drift warning.
 * 3. Two beats where the second restarts at the origin drift one metre; the linter
 *    warns at that cut's opening translation path, keyed by beat index.
 * 4. A nonsensical tolerance is a range error that short-circuits before any
 *    snapshot is compared.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateFilmContinuity on empty, singleton, resumed, drifted, and invalid-tolerance films, checking no-cut success, absence of resumed warnings, an actor-qualified cut warning, and a located range error.
 * @evidence contracts/testing.md#independent-expectations The authored root travels two metres in one second, so the half-second first beat ends one metre from its staging point. Staging the second at one metre must resume it, while staging at zero must warn at beat index one; no observed snapshot supplies either expected staging coordinate.
 * @evidence contracts/testing.md#distinguishing-cases Empty and singleton inputs have no cut; matched versus origin-reset staging distinguish a real previous-end/current-opening comparison from checking each beat alone. NaN tolerance must refuse before snapshot comparison rather than silently defaulting.
 * @evidence contracts/testing.md#execution-ownership Uses local scene, shot, and motion records with synchronous numerical snapshot resolution, without staging/registered-shot resume, rendering, resources, clocks, or replacement of dependencies. The checks observe advisory translation continuity and tolerance admission, not every continuity channel.
 */
export function test_film_continuity_walk(): void {
  TestValidator.equals(
    "an empty film passes",
    validateFilmContinuity({ beats: [] }),
    { success: true },
  );
  TestValidator.equals(
    "a single-beat film has no cut",
    validateFilmContinuity({ beats: [beatProps("b1", 0, 0.5)] }),
    { success: true },
  );

  const resumed: ReturnType<typeof validateFilmContinuity> =
    validateFilmContinuity({
      beats: [beatProps("b1", 0, 0.5), beatProps("b2", 1, 0.5)],
    });
  TestValidator.predicate(
    "a resumed cut has no drift",
    validationHasNoWarnings("resumed film cut", resumed),
  );

  const drifted: ReturnType<typeof validateFilmContinuity> =
    validateFilmContinuity({
      beats: [beatProps("b1", 0, 0.5), beatProps("b2", 0, 0.5)],
    });
  TestValidator.predicate(
    "a cut back to the origin warns, keyed by beat index",
    validationHasWarning(
      "film beat continuity drift",
      drifted,
      "physics",
      "$input.beats[1].opening.actors[node=hero].transform.translation",
    ),
  );

  const bad: ReturnType<typeof validateFilmContinuity> = validateFilmContinuity(
    {
      beats: [beatProps("b1", 0, 0.5), beatProps("b2", 0, 0.5)],
      positionTolerance: Number.NaN,
    },
  );
  TestValidator.predicate(
    "a non-finite tolerance is a range error",
    hasViolation(bad, "range", "$input.positionTolerance"),
  );
}
