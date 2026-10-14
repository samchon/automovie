import type { IAutoMovieFormationSlotState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { formationSlotMotionFixtures } from "./formationSlotMotionFixtures";
import { namedFacts } from "./namedFacts";

/** Run the original sixth formation-slot group with every id, window, slot, hero, state, overlap and sparsity-bound case unchanged; the owning test invokes it after ground cases and before the sparse-population group. */
export function assertFormationSlotMotionAdmission(): void {
  const {
    steps,
    leaves,
    state,
    compiled,
    contract,
    cueCodes,
    cueDiagnostics,
    spread,
  }: typeof formationSlotMotionFixtures = formationSlotMotionFixtures;
  const atTheCap: ReturnType<typeof cueDiagnostics> = cueDiagnostics(
    spread(256),
  );
  const overTheCap: ReturnType<typeof cueDiagnostics> = cueDiagnostics(
    spread(257),
  );
  TestValidator.equals(
    "the cue gate refuses every malformed exception and accepts sparse ones",
    namedFacts([
      [
        "twoMembersDoingDifferentThingsAtOnceAreAccepted",
        (): boolean =>
          cueCodes([steps([4], 2, "one"), leaves([5], 1, "two")]).length === 0,
      ],
      [
        "oneMemberInTwoSuccessiveCuesIsAccepted",
        (): boolean =>
          cueCodes([
            steps([4], 2, "first"),
            { ...steps([4], 5, "second"), start: 3, end: 4 },
          ]).length === 0,
      ],
      [
        "oneMemberInTwoOverlappingCuesIsRefused",
        (): boolean =>
          cueCodes([
            steps([4], 2, "first"),
            { ...steps([4], 5, "second"), start: 2, end: 4 },
          ]).length === 1,
      ],
      [
        "aBlankIdIsRefused",
        (): boolean => cueCodes([steps([4], 2, "")]).length === 1,
      ],
      [
        "aRepeatedIdIsRefused",
        (): boolean => cueCodes([steps([4], 2), steps([5], 2)]).length === 1,
      ],
      [
        "aUnitTheShotDoesNotStageIsRefused",
        (): boolean =>
          cueCodes([{ ...steps([4], 2), formation: "ghost" }]).length === 1 &&
          cueCodes([steps([4], 2)], []).length === 1,
      ],
      [
        "everyMalformedWindowIsRefused",
        (): boolean =>
          [
            { start: Number.NaN, end: 1 },
            { start: 0, end: Number.NaN },
            { start: -1, end: 1 },
            { start: 1, end: 1 },
            { start: 0, end: contract.durationSeconds + 1 },
          ].every(
            (time: { start: number; end: number }, index: number): boolean =>
              cueCodes([{ ...steps([4], 2, `window-${index}`), ...time }])
                .length === 1,
          ),
      ],
      [
        "everyMalformedSlotListIsRefused",
        (): boolean =>
          [[], [4, 4], [-1], [1.5], [9]].every(
            (slots: number[], index: number): boolean =>
              cueCodes([{ ...steps([4], 2, `slots-${index}`), slots }])
                .length === 1,
          ),
      ],
      [
        "aPromotedHeroIsRefusedItsOwnChannel",
        (): boolean =>
          cueCodes([steps([4], 2)], [compiled(9, [4])]).length === 1,
      ],
      [
        "unboundedMemberStateIsRefused",
        (): boolean =>
          [
            state({ offset: { x: Number.NaN, y: 0, z: 0 } }),
            state({ offset: { x: 1_000_000_001, y: 0, z: 0 } }),
            state({ facingOffsetDeg: Number.POSITIVE_INFINITY }),
            state({ facingOffsetDeg: 360_001 }),
          ].every(
            (bad: IAutoMovieFormationSlotState, index: number): boolean =>
              cueCodes([{ ...steps([4], 2, `state-${index}`), from: bad }])
                .length === 1,
          ),
      ],
      ["theCapItselfIsAccepted", (): boolean => atTheCap.length === 0],
      [
        "tooManyCuesAreRefused",
        (): boolean =>
          overTheCap.length === 1 &&
          overTheCap[0]!.code === "engine-validation-failed" &&
          overTheCap[0]!.message.includes("at most 256 sparse per-member cues"),
      ],
      [
        "tooManyNamedMembersAreRefused",
        (): boolean =>
          cueCodes(
            [
              {
                ...steps(
                  Array.from(
                    { length: 1_025 },
                    (_: unknown, index: number): number => index,
                  ),
                  2,
                  "everyone",
                ),
              },
            ],
            [compiled(2_000)],
          ).length === 1,
      ],
    ]),
    {
      twoMembersDoingDifferentThingsAtOnceAreAccepted: true,
      oneMemberInTwoSuccessiveCuesIsAccepted: true,
      oneMemberInTwoOverlappingCuesIsRefused: true,
      aBlankIdIsRefused: true,
      aRepeatedIdIsRefused: true,
      aUnitTheShotDoesNotStageIsRefused: true,
      everyMalformedWindowIsRefused: true,
      everyMalformedSlotListIsRefused: true,
      aPromotedHeroIsRefusedItsOwnChannel: true,
      unboundedMemberStateIsRefused: true,
      theCapItselfIsAccepted: true,
      tooManyCuesAreRefused: true,
      tooManyNamedMembersAreRefused: true,
    },
  );
}
