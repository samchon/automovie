import {
  type IAutoMovieFormationPlacement,
  formationSlotPosition,
  placeFormationSlot,
  rotateFormationLocalOffset,
  sampleFormationSlotMotion,
} from "@automovie/engine";
import type {
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationSlotState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";
import { formationSlotMotionFixtures } from "../internal/formationSlotMotionFixtures";
import { assertFormationSlotMotionSparsePopulation } from "../internal/assertFormationSlotMotionSparsePopulation";
import { assertFormationSlotMotionAdmission } from "../internal/assertFormationSlotMotionAdmission";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";

/**
 * Something may happen to one member of a crowd and not to its neighbours.
 *
 * A unit-level cue is the whole of what a group does together, so through it
 * nothing can befall one member alone: a cue that moves a unit moves every
 * member of it, and a member that should stumble, drop out, stop, or leave has
 * no channel at all. This is that channel, and it is sparse by contract — it
 * names slots, so a crowd of a hundred thousand pays for the three exceptions
 * it has and not for its own size. Nothing here knows what a member is: the
 * same cue serves a figure that falls, one that breaks from the group, and one
 * that pulls out of a line.
 *
 * Scenarios:
 *
 * 1. A named member holds identity before its first cue, interpolates inside one,
 *    and retains the cue's end state afterwards, while its neighbours and other
 *    units are untouched.
 * 2. Presence is held rather than interpolated, so a cue absent at both ends takes
 *    its member out at the start and one absent only at its end takes it out
 *    then, and either way it stays out.
 * 3. A member's offset is stated in its unit's own frame, so it turns with the
 *    unit, and the composed placement is the unit's cue plus the member's.
 * 4. The ground gate measures a displaced member where its own cue puts it, walks
 *    the interior of that cue, and never refuses a shot for a member the shot
 *    has removed.
 * 5. A crowd nobody singled out is measured exactly as it was before the channel
 *    existed.
 * 6. The cue gate refuses blank and duplicate ids, absent units, bad windows,
 *    empty, repeated and out-of-range slots, promoted heroes, unbounded state,
 *    two cues on one member at once, and either sparsity cap — while accepting
 *    two members doing different things at the same second, and accepting a
 *    shot standing exactly on the cue cap, which is what makes the refusal
 *    above the cap a refusal of the count rather than of anything else.
 * 7. The channel's cost is the exceptions it names and not the size of the crowd
 *    it names them in.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples member cues, composes placements and runs real ground/cue admission, asserting retained numeric states, discrete presence, rotated/composed offsets, interior-ground refusal, unchanged uninvolved populations and every original slot/state/window/id/hero/cap outcome.
 * @evidence contracts/testing.md#independent-expectations Authored linear endpoints give half/end offsets and discrete cue-boundary presence; a ninety-degree heading maps local +X to world -Z. Original floor/road geometry determines ground twins and the contract supplies 256-cue/1024-slot boundaries. Base positions reuse formationSlotPosition, so this is an offset-composition oracle rather than an independent base-layout proof; local JSON lengths describe only fixture representation, not measured runtime complexity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all seven numbered groups, every malformed window/slot/state twin, equal-start ordering, absent/other/out-of-range channels, removed members, identical paths over broken/unbroken floor, both sparsity limits and nine versus one-hundred-thousand-member cases. No original input, refusal count or message fragment is removed by extraction.
 * @evidence contracts/testing.md#execution-ownership The named test_production_formation_slot_motion owns groups one through five, then invokes assertFormationSlotMotionAdmission and assertFormationSlotMotionSparsePopulation for the original sixth and seventh groups in order. Shared fixtures retain original held/contract identity; all operations are portable CPU data/sampling/validation without allocating a crowd renderer, GPU, native artifact or host process.
 */
export function test_production_formation_slot_motion(): void {
  const { field, crossroads, unit, alone, state, held, steps, leaves, codes }: typeof formationSlotMotionFixtures = formationSlotMotionFixtures;
  const cue: IAutoMovieFormationSlotMotion = steps([4], 2);
  const before: IAutoMovieFormationSlotState = sampleFormationSlotMotion([cue], "crowd", 4, 0);
  const halfway: IAutoMovieFormationSlotState = sampleFormationSlotMotion([cue], "crowd", 4, 2);
  const after: IAutoMovieFormationSlotState = sampleFormationSlotMotion([cue], "crowd", 4, 5);
  const neighbour: IAutoMovieFormationSlotState = sampleFormationSlotMotion([cue], "crowd", 5, 2);
  const stranger: IAutoMovieFormationSlotState = sampleFormationSlotMotion([cue], "other", 4, 2);
  TestValidator.equals(
    "one named member deviates while its neighbours and other units do not",
    namedFacts([
      [
        "identityBeforeTheFirstCue",
        (): boolean => vclose(before.offset, cue.from.offset),
      ],
      ["halfwayIsHalfTheOffset", (): boolean => nclose(halfway.offset.x, 1)],
      ["theEndStateIsRetained", (): boolean => nclose(after.offset.x, 2)],
      ["theNeighbourIsUntouched", (): boolean => nclose(neighbour.offset.x, 0)],
      ["anotherUnitIsUntouched", (): boolean => nclose(stranger.offset.x, 0)],
      [
        "thePriorCueIsRetainedBetweenTwo",
        (): boolean =>
          nclose(
            sampleFormationSlotMotion(
              [cue, { ...steps([4], 5, "step-later"), start: 4, end: 5 }],
              "crowd",
              4,
              3.5,
            ).offset.x,
            2,
          ),
      ],
      [
        "equalStartsResolveTheSameEitherWay",
        (): boolean =>
          filmEffectValuesClose(
            sampleFormationSlotMotion(
              [steps([4], 2, "a"), steps([4], 9, "b")],
              "crowd",
              4,
              2,
            ),
            sampleFormationSlotMotion(
              [steps([4], 9, "b"), steps([4], 2, "a")],
              "crowd",
              4,
              2,
            ),
          ),
      ],
    ]),
    {
      identityBeforeTheFirstCue: true,
      halfwayIsHalfTheOffset: true,
      theEndStateIsRetained: true,
      theNeighbourIsUntouched: true,
      anotherUnitIsUntouched: true,
      thePriorCueIsRetainedBetweenTwo: true,
      equalStartsResolveTheSameEitherWay: true,
    },
  );

  const gone: IAutoMovieFormationSlotMotion = leaves([4], 2);
  const dwindles: IAutoMovieFormationSlotMotion = {
    ...steps([4], 0, "dwindle"),
    to: state({ present: false }),
  };
  TestValidator.equals(
    "presence is held rather than blended, and a member taken out stays out",
    namedFacts([
      [
        "presentJustBeforeTheCue",
        (): boolean => sampleFormationSlotMotion([gone], "crowd", 4, 1.9).present,
      ],
      [
        "absentFromTheCueStart",
        (): boolean =>
          sampleFormationSlotMotion([gone], "crowd", 4, 2).present === false,
      ],
      [
        "stillAbsentLongAfterwards",
        (): boolean =>
          sampleFormationSlotMotion([gone], "crowd", 4, 5.9).present === false,
      ],
      [
        "presentThroughACueThatEndsAbsent",
        (): boolean => sampleFormationSlotMotion([dwindles], "crowd", 4, 2.9).present,
      ],
      [
        "absentOnceThatCueEnds",
        (): boolean =>
          sampleFormationSlotMotion([dwindles], "crowd", 4, 3).present ===
          false,
      ],
      [
        "theNeighbourIsStillDrawn",
        (): boolean => sampleFormationSlotMotion([gone], "crowd", 5, 5.9).present,
      ],
    ]),
    {
      presentJustBeforeTheCue: true,
      absentFromTheCueStart: true,
      stillAbsentLongAfterwards: true,
      presentThroughACueThatEndsAbsent: true,
      absentOnceThatCueEnds: true,
      theNeighbourIsStillDrawn: true,
    },
  );

  const facing: IAutoMovieFormationPlacement = unit(9);
  const turned: IAutoMovieFormationPlacement = { ...facing, facingDeg: 90 };
  const aside: IAutoMovieFormationSlotState = state({ offset: { x: 1, y: 0.5, z: 0 }, facingOffsetDeg: 30 });
  const placedStraight: ReturnType<typeof placeFormationSlot> = placeFormationSlot({
    position: formationSlotPosition(facing, 4),
    facingDeg: facing.facingDeg,
    anchor: facing.anchor,
    baseFacingDeg: facing.facingDeg,
    unit: held,
    member: aside,
  });
  const placedTurned: ReturnType<typeof placeFormationSlot> = placeFormationSlot({
    position: formationSlotPosition(turned, 4),
    facingDeg: turned.facingDeg,
    anchor: turned.anchor,
    baseFacingDeg: turned.facingDeg,
    unit: held,
    member: aside,
  });
  const carried: ReturnType<typeof placeFormationSlot> = placeFormationSlot({
    position: formationSlotPosition(facing, 4),
    facingDeg: facing.facingDeg,
    anchor: facing.anchor,
    baseFacingDeg: facing.facingDeg,
    unit: { ...held, translation: { x: 0, y: 0, z: 10 } },
    member: aside,
  });
  const untouched: ReturnType<typeof placeFormationSlot> = placeFormationSlot({
    position: formationSlotPosition(facing, 4),
    facingDeg: facing.facingDeg,
    anchor: facing.anchor,
    baseFacingDeg: facing.facingDeg,
    unit: held,
    member: state(),
  });
  TestValidator.equals(
    "a member's offset is stated in its unit's frame and composes with the unit",
    namedFacts([
      [
        "asideIsAsideWhileTheUnitFacesForward",
        (): boolean =>
          vclose(placedStraight.position, {
            x: formationSlotPosition(facing, 4).x + 1,
            y: formationSlotPosition(facing, 4).y + 0.5,
            z: formationSlotPosition(facing, 4).z,
          }),
      ],
      [
        "theSameAsideTurnsWithTheUnit",
        (): boolean =>
          vclose(placedTurned.position, {
            x: formationSlotPosition(turned, 4).x,
            y: formationSlotPosition(turned, 4).y + 0.5,
            z: formationSlotPosition(turned, 4).z - 1,
          }),
      ],
      [
        "theUnitStillCarriesTheMemberWithIt",
        (): boolean => nclose(carried.position.z, placedStraight.position.z + 10),
      ],
      [
        "headingsAddRatherThanReplace",
        (): boolean => nclose(placedStraight.facingDeg, facing.facingDeg + 30),
      ],
      [
        "anUntouchedMemberStandsExactlyWhereItWasDesigned",
        (): boolean =>
          vclose(untouched.position, formationSlotPosition(facing, 4)) &&
          untouched.present,
      ],
      [
        "aZeroOffsetTurnsToNothing",
        (): boolean =>
          vclose(rotateFormationLocalOffset({ x: 0, y: 0, z: 0 }, 137), {
            x: 0,
            y: 0,
            z: 0,
          }),
      ],
    ]),
    {
      asideIsAsideWhileTheUnitFacesForward: true,
      theSameAsideTurnsWithTheUnit: true,
      theUnitStillCarriesTheMemberWithIt: true,
      headingsAddRatherThanReplace: true,
      anUntouchedMemberStandsExactlyWhereItWasDesigned: true,
      aZeroOffsetTurnsToNothing: true,
    },
  );

  const floor: ReturnType<typeof field> = field(3);
  const crowd: IAutoMovieFormationPlacement = unit(9);
  // One member alone, standing in the north arm and ending in the east one. Both
  // ends are carried; the straight path between them is not, and the gate walks
  // that path rather than only its ends.
  const lone: IAutoMovieFormationPlacement = alone({ x: 0, y: 0, z: 4 });
  const crosses: IAutoMovieFormationSlotMotion = {
    ...steps([0], 0, "cross"),
    to: state({ offset: { x: 4, y: 0, z: -4 } }),
  };
  TestValidator.equals(
    "the ground gate reads each member through its own cue",
    namedFacts([
      ["aCrowdOnItsFloorIsCarried", (): boolean => codes(floor, [crowd]).length === 0],
      [
        "aMemberWalkedOffTheFloorIsRefused",
        (): boolean => codes(floor, [crowd], [steps([4], 20)]).length === 1,
      ],
      [
        "aMemberRemovedBeforeItLeavesIsNotRefused",
        (): boolean =>
          codes(
            floor,
            [crowd],
            [
              {
                ...steps([4], 20, "removed-walk"),
                from: state({ present: false }),
                to: state({ present: false, offset: { x: 20, y: 0, z: 0 } }),
              },
            ],
          ).length === 0,
      ],
      [
        "aMemberCrossingBetweenTwoRoadsIsRefusedInTheMiddle",
        (): boolean => codes(crossroads(6, 1), [lone], [crosses]).length === 1,
      ],
      // The same member, the same two endpoints, the same cue -- over unbroken
      // floor wide enough to carry the diagonal. What separates this answer
      // from the refusal above is only the ground under the path, so neither
      // reading is about the endpoints and neither is about crossing as such.
      [
        "theSameCrossingOverUnbrokenFloorIsNotRefused",
        (): boolean => codes(field(6), [lone], [crosses]).length === 0,
      ],
      [
        "aShotThatStagedNoSpaceIsNotMeasured",
        (): boolean => codes(null, [crowd], [steps([4], 20)]).length === 0,
      ],
    ]),
    {
      aCrowdOnItsFloorIsCarried: true,
      aMemberWalkedOffTheFloorIsRefused: true,
      aMemberRemovedBeforeItLeavesIsNotRefused: true,
      aMemberCrossingBetweenTwoRoadsIsRefusedInTheMiddle: true,
      theSameCrossingOverUnbrokenFloorIsNotRefused: true,
      aShotThatStagedNoSpaceIsNotMeasured: true,
    },
  );

  const tight: ReturnType<typeof field> = field(1.2);
  TestValidator.equals(
    "a crowd nobody singled out is measured exactly as it was before",
    namedFacts([
      [
        "anEmptyChannelReadsAsNoChannel",
        (): boolean =>
          JSON.stringify(codes(tight, [crowd], [])) ===
          JSON.stringify(codes(tight, [crowd], undefined)),
      ],
      [
        "aChannelForAnotherUnitReadsAsNoChannel",
        (): boolean =>
          JSON.stringify(
            codes(tight, [crowd], [{ ...steps([0], 20), formation: "other" }]),
          ) === JSON.stringify(codes(tight, [crowd], undefined)),
      ],
      [
        "aSlotOutsideTheUnitIsNotMeasured",
        (): boolean =>
          JSON.stringify(codes(floor, [crowd], [steps([99], 20)])) ===
          JSON.stringify(codes(floor, [crowd], undefined)),
      ],
    ]),
    {
      anEmptyChannelReadsAsNoChannel: true,
      aChannelForAnotherUnitReadsAsNoChannel: true,
      aSlotOutsideTheUnitIsNotMeasured: true,
    },
  );

  assertFormationSlotMotionAdmission();
  assertFormationSlotMotionSparsePopulation();
}
