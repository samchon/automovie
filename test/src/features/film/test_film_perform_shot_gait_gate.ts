import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import {
  IAutoMovieActionCall,
  IAutoMovieCameraAction,
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
import { hasViolation, namedFacts } from "../internal/predicates";

const locomote: (gait: string) => IAutoMovieActionCall = (gait: string): IAutoMovieActionCall => ({
  verb: "locomote",
  actor: "knightA",
  start: 0,
  duration: 1,
  gait,
  to: { kind: "point", point: { x: 0, y: 0, z: 0.25 } },
});

const frame: IAutoMovieCameraAction = {
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
};

const run: (gait: string, gaits: ((node: string) => readonly string[] | undefined) | undefined) => IAutoMoviePerformedShot = (
  gait: string,
  gaits: ((node: string) => readonly string[] | undefined) | undefined,
): IAutoMoviePerformedShot =>
  performShot({
    script: makeScriptWrite(),
    staged: ((): IAutoMovieStagedSet.ISuccess => {
      const s: IAutoMovieStagedSet = stageScene(makeScriptWrite(), makeStagingWrite());
      if (s.success !== true) throw new Error("staging must succeed");
      return s;
    })(),
    performance: makePerformanceWrite({
      draft: [locomote(gait), frame],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    ...(gaits === undefined ? {} : { gaits }),
  });

/**
 * Performs locomote with a supplied gait vocabulary and checks admitted names, located unknown-name messages, empty vocabulary and omitted or undefined lookup behavior.
 *
 * Scenarios:
 * 1. Accept a gait in the supplied vocabulary.
 * 2. Refuse an absent gait and name the available choices.
 * 3. Report an empty vocabulary as none supplied.
 * 4. Skip vocabulary admission when its lookup is omitted.
 * 5. Skip vocabulary admission when the actor lookup returns undefined.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs locomote with a supplied gait vocabulary and checks admitted names, located unknown-name messages, empty vocabulary and omitted or undefined lookup behavior.
 * @evidence contracts/testing.md#independent-expectations The callback's authored walk/run names define membership; the contract skips admission when the lookup or actor's set is undefined. Successful admission with the fixture synthesizer does not prove a real gait animates.
 * @evidence contracts/testing.md#distinguishing-cases Preserves present, absent, empty, omitted lookup and undefined actor-set cases; shipped gait synthesis has its own entry.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_gait_gate unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_gait_gate(): void {
  // (a) gait present in the supplied set → no gait violation
  const present: IAutoMoviePerformedShot = run("walk", (): string[] => ["walk", "run"]);
  TestValidator.equals("supplied gait passes the gate", present.success, true);

  // (b) gait absent, actor supplies some gaits → violation names them
  const absent: IAutoMoviePerformedShot = run("march", (): string[] => ["walk", "run"]);
  TestValidator.equals("unsupplied gait fails the gate", absent.success, false);
  TestValidator.predicate(
    "unsupplied gait is reported on $input.draft[0].gait",
    hasViolation(absent, "type", "$input.draft[0].gait"),
  );
  TestValidator.equals(
    "the violation lists the actor's available gaits",
    namedFacts([
      ["refused", (): boolean => absent.success === false],
      [
        "violated",
        (): boolean =>
          absent.success === false &&
          absent.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path.includes("[0].gait") &&
              v.expected.includes("walk, run") &&
              v.expected.includes('"march"'),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // (c) actor supplies no gaits → "none supplied"
  const none: IAutoMoviePerformedShot = run("march", (): string[] => []);
  TestValidator.equals(
    "an actor with no gaits reads 'none supplied'",
    namedFacts([
      ["refused", (): boolean => none.success === false],
      [
        "violated",
        (): boolean =>
          none.success === false &&
          none.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path.includes("[0].gait") &&
              v.expected.includes("none supplied"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  // (d) lookup omitted → gate skipped even for an unknown gait.
  const skipped: IAutoMoviePerformedShot = run("march", undefined);
  TestValidator.equals(
    "omitting the gaits lookup skips the gate",
    skipped.success,
    true,
  );

  // (d') lookup present but returns undefined for the actor → also skipped
  const unknownActor: IAutoMoviePerformedShot = run("march", (): undefined => undefined);
  TestValidator.equals(
    "an undefined gait set for the actor skips the gate",
    unknownActor.success,
    true,
  );
}
