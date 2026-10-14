import { IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "@automovie/engine";
import { IAutoMovieStagedSet } from "@automovie/engine";
import { performShot } from "@automovie/engine";
import { stageScene } from "@automovie/engine";
import { assertFilmNonFrameActorShapes } from "../internal/assertFilmNonFrameActorShapes";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Performance input gates return located referential, timing and verb-field faults.
 *
 * Scenarios:
 * 1. Collect unknown beat, zero shot duration, unstaged actor and out-of-span start together.
 * 2. Refuse invalid action duration/repeat/list, force/intensity, targets and untargeted point.
 * 3. Preserve malformed actor-shape refusal and located relative/unstaged react-source errors.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls performShot on the original incoherent and single-field mutations and checks exact type/range paths, catching omitted input gates or escaped actor-shape iteration failures.
 * @evidence contracts/testing.md#independent-expectations The script/stage declare the legal ids and two-second span; positive duration/integer repeat, bounded force/intensity and resolvable targets define expected field refusals. Literal input indices determine paths without using output as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves every original shot/action/actor/repeat/force/intensity/target case and the shared non-frame actor-shape cases; accepted performances and camera selection are owned by focused neighbouring entries.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable entry owns its original cases and delegates existing malformed actor cases to assertFilmNonFrameActorShapes, not a new driver; source validation runs in memory without a process or renderer.
 */
export function test_film_perform_shot_bad_refs(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-99",
      duration: 0,
      draft: [
        {
          verb: "gesture",
          actor: "ghost",
          start: 5,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("fails", performed.success, false);
  TestValidator.equals(
    "unknown beat",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean => hasViolation(performed, "type", "$input.beat"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "zero duration",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean => hasViolation(performed, "range", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "unstaged actor",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean => hasViolation(performed, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "start out of shot",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(performed, "range", "$input.draft[0].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const zeroActionDuration: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 0,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "zero action duration rejected",
    namedFacts([
      ["refused", (): boolean => zeroActionDuration.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(zeroActionDuration, "range", "$input.draft[0].duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const overrunActionDuration: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 1.5,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "overrun action duration rejected",
    namedFacts([
      ["refused", (): boolean => overrunActionDuration.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(
            overrunActionDuration,
            "range",
            "$input.draft[0].duration",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const zeroRepeat: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          repeat: 0,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "zero repeat rejected",
    namedFacts([
      ["refused", (): boolean => zeroRepeat.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(zeroRepeat, "range", "$input.draft[0].repeat"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const fractionalRepeat: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          repeat: 1.5,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "fractional repeat rejected",
    namedFacts([
      ["refused", (): boolean => fractionalRepeat.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(fractionalRepeat, "range", "$input.draft[0].repeat"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const emptyActorList: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: [],
          start: 0,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "empty actor list rejected",
    namedFacts([
      ["refused", (): boolean => emptyActorList.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(emptyActorList, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const duplicateActor: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: ["knightA", "knightA"],
          start: 0,
          duration: 1,
          kind: "wave",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "duplicate actor list entry rejected",
    namedFacts([
      ["refused", (): boolean => duplicateActor.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(duplicateActor, "type", "$input.draft[0].actor[1]"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const oversizedReact: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "react",
          actor: "knightA",
          start: 0,
          duration: 1,
          from: { kind: "node", node: "knightB" },
          force: 1.2,
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "oversized react force rejected",
    namedFacts([
      ["refused", (): boolean => oversizedReact.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(oversizedReact, "range", "$input.draft[0].force"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const oversizedEmote: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "emote",
          actor: "knightA",
          start: 0,
          duration: 1,
          preset: "happy",
          intensity: 1.2,
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "oversized emote intensity rejected",
    namedFacts([
      ["refused", (): boolean => oversizedEmote.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(oversizedEmote, "range", "$input.draft[0].intensity"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const relativeReach: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "reach",
          actor: "knightA",
          start: 0,
          duration: 1,
          hand: "right",
          to: { kind: "direction", headingDeg: 90 },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "relative reach target rejected",
    namedFacts([
      ["refused", (): boolean => relativeReach.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(relativeReach, "type", "$input.draft[0].to"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const relativeLook: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "direction", headingDeg: 90 },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "relative lookAt target rejected",
    namedFacts([
      ["refused", (): boolean => relativeLook.success === false],
      [
        "violated",
        (): boolean => hasViolation(relativeLook, "type", "$input.draft[0].to"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const untargetedPoint: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          kind: "point",
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "untargeted point gesture rejected",
    namedFacts([
      ["refused", (): boolean => untargetedPoint.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(untargetedPoint, "type", "$input.draft[0].at"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const relativeStrike: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          kind: "strike",
          at: { kind: "direction", headingDeg: 90 },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "relative strike target rejected",
    namedFacts([
      ["refused", (): boolean => relativeStrike.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(relativeStrike, "type", "$input.draft[0].at"),
      ],
    ]),
    { refused: true, violated: true },
  );

  assertFilmNonFrameActorShapes(staged);

  for (const [label, from] of [
    ["relative react source rejected", { kind: "direction", headingDeg: 90 }],
    ["unstaged react source rejected", { kind: "node", node: "ghost" }],
  ] as const) {
    const unresolvedReact: IAutoMoviePerformedShot = performShot({
      script: makeScriptWrite(),
      staged,
      performance: makePerformanceWrite({
        draft: [
          {
            verb: "react",
            actor: "knightA",
            start: 0,
            duration: 1,
            from,
            force: 0.5,
          },
        ],
        revise: { review: "unchanged.", final: null },
      }),
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    });
    TestValidator.equals(
      label,
      namedFacts([
        ["refused", (): boolean => unresolvedReact.success === false],
        [
          "violated",
          (): boolean =>
            hasViolation(unresolvedReact, "type", "$input.draft[0].from"),
        ],
      ]),
      { refused: true, violated: true },
    );
  }
}
