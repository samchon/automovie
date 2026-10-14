import { performShot, stageScene } from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieCameraIntent,
  IAutoMovieConstraintViolation,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const staged: Extract<
  ReturnType<typeof stageScene>,
  { success: true }
> = ((): Extract<ReturnType<typeof stageScene>, { success: true }> => {
  const result: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (result.success !== true) throw new Error("staging fixture must succeed");
  return result;
})();

/** Perform the beat-1 fixture with its frame action swapped for `frame`. */
const perform: (
  frame: IAutoMovieActionCall,
) => ReturnType<typeof performShot> = (
  frame: IAutoMovieActionCall,
): ReturnType<typeof performShot> => {
  const base: ReturnType<typeof makePerformanceWrite> = makePerformanceWrite();
  return performShot({
    script: makeScriptWrite(),
    staged,
    performance: {
      ...base,
      draft: [...base.draft.slice(0, 2), frame],
    },
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
};

const frameAction: (
  over?: Partial<Extract<IAutoMovieActionCall, { verb: "frame" }>>,
) => IAutoMovieActionCall = (
  over: Partial<Extract<IAutoMovieActionCall, { verb: "frame" }>> = {},
): IAutoMovieActionCall => ({
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
  ...over,
});

/**
 * The camera-intent guide metadata (#1187): a frame action may carry a `focus`
 * target and a `focalLength`: structural intent metadata for a render host,
 * never consumed by the deterministic camera solve. `performShot` validates
 * them like any target/scalar and emits the resolved record on
 * `shot.cameraIntent`, exactly as it emits `shot.events`.
 *
 * Scenarios:
 *
 * 1. A frame with `focus: knightB` and `focalLength: 85` emits one intent entry
 *    carrying the framing/move, knightB's staged world point, and 85 mm.
 * 2. Omitting both intents emits the entry with `focus`/`focalLength` null, and
 *    the compiled cameraMotion retains the same structure and exact numeric
 *    components with or without the intents.
 * 3. A focus target naming an unstaged node is a `type` violation at `.focus`; a
 *    zero and a non-finite `focalLength` are `range` violations at
 *    `.focalLength`.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot with present or omitted camera intents and with invalid focus/focal lengths, checking emitted lens metadata, resolved focus, invariant compiled motion, and located type/range refusals.
 * @evidence contracts/testing.md#independent-expectations The staged knightB point (0,0,0.7), authored 85 mm focal length, and explicit medium/static vocabulary form the positive oracle. The paired clip comparison establishes intent noninterference rather than an independent camera-path oracle; ghost, zero, and NaN have explicit refusal expectations.
 * @evidence contracts/testing.md#distinguishing-cases Present versus omitted intents distinguishes metadata carriage and null defaults from camera solving; an unstaged focus and zero/nonfinite lenses distinguish target and scalar admission while preserving the valid framing fixture.
 * @evidence contracts/testing.md#execution-ownership Uses real staging and performance assembly with local skeleton and synthesizer callbacks through declared product seams, without a renderer, resource access, clock, or replacement of dependencies. Existing test12ValuesClose retains record keys, track order, lengths, and exact nclose numeric comparisons for the paired clips.
 */
export function test_film_camera_intent(): void {
  // 1. intents ride to shot.cameraIntent.
  const withIntent: ReturnType<typeof perform> = perform(
    frameAction({
      focus: { kind: "node", node: "knightB" },
      focalLength: 85,
    }),
  );
  TestValidator.equals("performs", withIntent.success, true);
  if (withIntent.success !== true) return;
  const intent: IAutoMovieCameraIntent[] = withIntent.shot.cameraIntent!;
  TestValidator.equals("one intent entry", intent.length, 1);
  TestValidator.equals(
    "framing and move carried",
    [
      intent[0]!.framing,
      intent[0]!.move,
      nclose(intent[0]!.focalLength ?? Number.NaN, 85),
    ],
    ["medium", "static", true],
  );
  TestValidator.predicate(
    "focus resolves to knightB's staged point",
    vclose(intent[0]!.focus!, { x: 0, y: 0, z: 0.7 }),
  );

  // 2. omitted intents are null, and the solve is untouched by them.
  const without: ReturnType<typeof perform> = perform(frameAction());
  TestValidator.equals("performs without intents", without.success, true);
  if (without.success !== true) return;
  TestValidator.equals(
    "omitted intents are null",
    [
      without.shot.cameraIntent![0]!.focus,
      without.shot.cameraIntent![0]!.focalLength,
    ],
    [null, null],
  );
  TestValidator.predicate(
    "the camera solve preserves structure and numeric components with or without intents",
    test12ValuesClose(withIntent.shot.cameraMotion, without.shot.cameraMotion),
  );

  // 3. gates.
  const ghost: ReturnType<typeof perform> = perform(
    frameAction({ focus: { kind: "node", node: "ghost" } }),
  );
  TestValidator.equals(
    "an unstaged focus node is a type violation",
    namedFacts([
      ["refused", (): boolean => ghost.success === false],
      [
        "violated",
        (): boolean =>
          ghost.success === false &&
          ghost.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "type" && v.path.includes(".focus"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
  const zeroLens: ReturnType<typeof perform> = perform(
    frameAction({ focalLength: 0 }),
  );
  TestValidator.equals(
    "a zero focal length is a range violation",
    namedFacts([
      ["refused", (): boolean => zeroLens.success === false],
      [
        "violated",
        (): boolean =>
          zeroLens.success === false &&
          zeroLens.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "range" && v.path.includes(".focalLength"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
  const nanLens: ReturnType<typeof perform> = perform(
    frameAction({ focalLength: Number.NaN }),
  );
  TestValidator.equals(
    "a non-finite focal length is a range violation",
    namedFacts([
      ["refused", (): boolean => nanLens.success === false],
      [
        "violated",
        (): boolean =>
          nanLens.success === false &&
          nanLens.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.kind === "range" && v.path.includes(".focalLength"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
