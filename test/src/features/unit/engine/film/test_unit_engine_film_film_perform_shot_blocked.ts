import { performShot, stageScene } from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieAttachAction,
  IAutoMovieBlocking,
  IAutoMovieConstraintViolation,
  IAutoMovieEmoteAction,
  IAutoMovieEnactAction,
  IAutoMovieGestureAction,
  IAutoMovieHoldAction,
  IAutoMovieLaunchAction,
  IAutoMovieLocomoteAction,
  IAutoMovieLookAtAction,
  IAutoMoviePerformance,
  type IAutoMoviePerformedShot,
  IAutoMovieReachAction,
  IAutoMovieReactAction,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import { createSkeleton } from "../../../internal/fixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

const run: (
  blocking: IAutoMovieBlocking,
  performance?: IAutoMoviePerformance,
) => IAutoMoviePerformedShot = (
  blocking: ReturnType<typeof makeBlockingWrite>,
  performance: IAutoMoviePerformance = makePerformanceWrite(),
): IAutoMoviePerformedShot =>
  performShot({
    script: makeScriptWrite(),
    staged: ((): IAutoMovieStagedSet.ISuccess => {
      const staged: IAutoMovieStagedSet = stageScene(
        makeScriptWrite(),
        makeStagingWrite(),
      );
      if (staged.success !== true) throw new Error("staging must succeed");
      return staged;
    })(),
    performance,
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    blocking,
  });

/**
 * A performed shot must realize its blocking beat, timing anchors and camera intent.
 *
 * Scenarios:
 * 1. Accept aligned anchors, including an auto-duration actor.
 * 2. Refuse beat/duration mismatch, a late uncovered knightB cue and wrong framing/move.
 * 3. Refuse unauthored follow intent.
 */
export function test_unit_engine_film_film_perform_shot_blocked(): void {
  const aligned: IAutoMoviePerformedShot = run(
    makeBlockingWrite({
      actors: [
        {
          node: "knightA",
          beats: "advances, then strikes",
          anchors: [{ t: 1, cue: "the strike lands" }],
        },
        {
          node: "knightB",
          beats: "watches to the end",
          anchors: [{ t: 1.9, cue: "still watching" }],
        },
      ],
    }),
    makePerformanceWrite({
      draft: [
        ...makePerformanceWrite().draft,
        {
          verb: "lookAt",
          actor: "knightB",
          start: 0,
          duration: "auto",
          to: { kind: "node", node: "knightA" },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
  );
  TestValidator.equals("aligned blocking passes", aligned.success, true);

  const wrongBeat: IAutoMoviePerformedShot = run(
    makeBlockingWrite({ beat: "beat-99" }),
  );
  TestValidator.equals(
    "beat mismatch rejected",
    namedFacts([
      ["refused", (): boolean => wrongBeat.success === false],
      [
        "violated",
        (): boolean =>
          wrongBeat.success === false &&
          hasViolation(wrongBeat, "type", "$input.beat"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const wrongDuration: IAutoMoviePerformedShot = run(
    makeBlockingWrite({ duration: 3 }),
  );
  TestValidator.equals(
    "duration mismatch rejected",
    namedFacts([
      ["refused", (): boolean => wrongDuration.success === false],
      [
        "violated",
        (): boolean =>
          wrongDuration.success === false &&
          hasViolation(wrongDuration, "range", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const dropped: IAutoMoviePerformedShot = run(
    makeBlockingWrite({
      actors: [
        {
          node: "knightB",
          beats: "reacts late in the beat",
          anchors: [{ t: 1.9, cue: "the flinch" }],
        },
      ],
    }),
  );
  TestValidator.equals(
    "uncovered anchor rejected with its cue",
    namedFacts([
      ["refused", (): boolean => dropped.success === false],
      [
        "violated",
        (): boolean =>
          dropped.success === false &&
          dropped.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "range" && String(v.expected).includes("the flinch"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const wrongCamera: IAutoMoviePerformedShot = run(
    makeBlockingWrite({
      camera: {
        framing: "close",
        move: "push-in",
        on: { kind: "node", node: "knightA" },
      },
    }),
  );
  TestValidator.equals(
    "camera intent mismatch rejected on framing and move",
    namedFacts([
      ["wrongCameraSuccess", (): boolean => wrongCamera.success === false],
      [
        "hasViolationWrongCameraType",
        (): boolean =>
          wrongCamera.success === false &&
          hasViolation(wrongCamera, "type", "$input.draft[2].framing"),
      ],
      [
        "hasViolationWrongCameraType2",
        (): boolean =>
          wrongCamera.success === false &&
          hasViolation(wrongCamera, "type", "$input.draft[2].move"),
      ],
    ]),
    {
      wrongCameraSuccess: true,
      hasViolationWrongCameraType: true,
      hasViolationWrongCameraType2: true,
    },
  );

  const unframed: IAutoMoviePerformedShot = run(
    makeBlockingWrite({
      camera: {
        framing: "medium",
        move: "follow",
        on: { kind: "node", node: "knightA" },
      },
    }),
    makePerformanceWrite({
      draft: makePerformanceWrite().draft.filter(
        (
          a: IAutoMovieActionCall,
        ): a is
          | IAutoMovieLocomoteAction
          | IAutoMovieGestureAction
          | IAutoMovieReachAction
          | IAutoMovieLookAtAction
          | IAutoMovieAttachAction
          | IAutoMovieLaunchAction
          | IAutoMovieReactAction
          | IAutoMovieEmoteAction
          | IAutoMovieHoldAction
          | IAutoMovieEnactAction => a.verb !== "frame",
      ),
      revise: { review: "unchanged.", final: null },
    }),
  );
  TestValidator.equals(
    "unauthored camera move rejected",
    namedFacts([
      ["refused", (): boolean => unframed.success === false],
      [
        "violated",
        (): boolean =>
          unframed.success === false &&
          unframed.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              String(v.expected).includes('asks for a "follow" camera'),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
