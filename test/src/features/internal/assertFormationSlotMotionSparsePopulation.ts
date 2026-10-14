import {
  type IAutoMovieFormationPlacement,
  formationSlotPosition,
  placeFormationSlot,
  sampleFormationSlotMotion,
} from "@automovie/engine";
import type { IAutoMovieFormationSlotMotion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectValuesClose } from "./filmEffectValuesClose";
import { formationSlotMotionFixtures } from "./formationSlotMotionFixtures";
import { namedFacts } from "./namedFacts";

/** Run the original seventh formation-slot case after the original sampling, placement, ground and admission cases. Local serialized-size comparisons describe only the fixture representation; actual behavior is observed through the sampler, placement and cue gate. */
export function assertFormationSlotMotionSparsePopulation(): void {
  const {
    unit,
    leaves,
    compiled,
    held,
    steps,
    cueCodes,
  }: typeof formationSlotMotionFixtures = formationSlotMotionFixtures;
  // Written as a function of the crowd rather than as a literal, so a channel
  // that ever grew a per-member field would show up here as a longer record.
  const evacuate: (
    crowd: IAutoMovieFormationPlacement,
    departing: number,
  ) => IAutoMovieFormationSlotMotion[] = (
    crowd: IAutoMovieFormationPlacement,
    departing: number,
  ): IAutoMovieFormationSlotMotion[] => [
    leaves(
      Array.from(
        { length: departing },
        (_: unknown, index: number): number => index,
      ),
      2,
      `${crowd.id}-departure`,
    ),
  ];
  const small: IAutoMovieFormationPlacement = unit(9);
  const vast: IAutoMovieFormationPlacement = unit(100_000);
  const bytes: (cues: readonly IAutoMovieFormationSlotMotion[]) => number = (
    cues: readonly IAutoMovieFormationSlotMotion[],
  ): number => JSON.stringify(cues).length;
  TestValidator.equals(
    "the channel costs the exceptions it names and not the crowd it names them in",
    namedFacts([
      [
        "threeDeparturesCostTheSameInACrowdOfNineAndOfAHundredThousand",
        (): boolean => bytes(evacuate(small, 3)) === bytes(evacuate(vast, 3)),
      ],
      [
        "oneMoreDepartingMemberCostsOneMoreSlot",
        (): boolean => bytes(evacuate(vast, 4)) > bytes(evacuate(vast, 3)),
      ],
      [
        "oneMoreExceptionCostsOneMoreRecord",
        (): boolean =>
          bytes([...evacuate(vast, 3), steps([9], 2, "aside")]) >
          bytes(evacuate(vast, 3)),
      ],
      [
        "aVastCrowdReadsOneMemberFromItsOwnCuesAlone",
        (): boolean =>
          sampleFormationSlotMotion(evacuate(vast, 3), vast.id, 1, 5)
            .present === false &&
          sampleFormationSlotMotion(evacuate(vast, 3), vast.id, 99_999, 5)
            .present,
      ],
      [
        "theSameDesignAndCuesReproduceTheSamePlacement",
        (): boolean =>
          filmEffectValuesClose(
            placeFormationSlot({
              position: formationSlotPosition(vast, 4),
              facingDeg: vast.facingDeg,
              anchor: vast.anchor,
              baseFacingDeg: vast.facingDeg,
              unit: held,
              member: sampleFormationSlotMotion(
                [steps([4], 2, "aside")],
                vast.id,
                4,
                2,
              ),
            }),
            placeFormationSlot({
              position: formationSlotPosition(unit(100_000), 4),
              facingDeg: vast.facingDeg,
              anchor: vast.anchor,
              baseFacingDeg: vast.facingDeg,
              unit: held,
              member: sampleFormationSlotMotion(
                [steps([4], 2, "aside")],
                vast.id,
                4,
                2,
              ),
            }),
          ),
      ],
      [
        "theCueGateAcceptsTheSameSparseChannelAtEitherSize",
        (): boolean =>
          cueCodes(evacuate(small, 3), [compiled(9)]).length === 0 &&
          cueCodes(evacuate(vast, 3), [compiled(100_000)]).length === 0,
      ],
    ]),
    {
      threeDeparturesCostTheSameInACrowdOfNineAndOfAHundredThousand: true,
      oneMoreDepartingMemberCostsOneMoreSlot: true,
      oneMoreExceptionCostsOneMoreRecord: true,
      aVastCrowdReadsOneMemberFromItsOwnCuesAlone: true,
      theSameDesignAndCuesReproduceTheSamePlacement: true,
      theCueGateAcceptsTheSameSparseChannelAtEitherSize: true,
    },
  );
}
