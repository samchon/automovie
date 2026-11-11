import {
  AutoMovieMotionHumanVariation,
  AutoMovieMotionManner,
  HumanSkill,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Varying an action's slots leaves the draws the action already reads where
 * they were: the manner's tempo and extent offsets come from the same stream
 * values with and without slots.
 *
 * Scenarios:
 * 1. On real streams of one action instance, the manner's modifiers at full
 *    variation and proficiency 0 are read, then five slots are varied, then
 *    the modifiers are read again: they are equal, and differ from the
 *    neutral ones.
 * 2. The channel `manner` of the instance still gives the two floats the
 *    modifiers were made from: the tempo is 1 plus the first float's offset
 *    within the novice's bound of 14 %.
 * 3. A slot's key is not the instance stream's channel: a slot keyed `manner`
 *    draws another value than the channel `manner`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the manner's resolver and the slot functions on one real context; a slot that advances or shares the instance's streams, or a slot stream keyed like an existing channel, fails.
 * @evidence contracts/development/testing.md#independent-expectations The tempo is the documented offset `variation x bound x (2u - 1)` on the stream's first float, worked out here from the float and the stated 14 %.
 * @evidence contracts/development/testing.md#distinguishing-cases Reads the modifiers before and after the slots, and a slot key that collides with a channel's name.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real seeded streams. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios.
 */
export function test_motion_compose_variation_existing(): void {
  const skill: HumanSkill.ISkill = HumanSkill.resolve({ p: 0 }, "film");
  const context = {
    skill,
    random: (channel: string) =>
      HumanSkill.stream(skill, "a", "wave", 3, channel),
    series: (channel: string) => ({
      random: HumanSkill.series(skill, "a", "wave", channel),
      index: 3,
    }),
  };
  const manner: AutoMovieMotionManner.IManner = {
    variation: 1,
    proficiency: 0,
  };
  const before = AutoMovieMotionManner.of(context, manner);
  const source = AutoMovieMotionHumanVariation.of(context, manner)!;
  const slots: number[] = [
    AutoMovieMotionHumanVariation.amount(source, "amount", 0.5),
    AutoMovieMotionHumanVariation.duration(source, "duration", 0.3),
    AutoMovieMotionHumanVariation.pause(source, "pause", 0.4),
    AutoMovieMotionHumanVariation.bend(source, "bend", 0.2),
    AutoMovieMotionHumanVariation.bend(source, "manner", 0.2),
  ];
  TestValidator.equals(
    "the manner's modifiers after the slots",
    AutoMovieMotionManner.of(context, manner),
    before,
  );
  const first: number = context.random("manner").float(0);
  TestValidator.predicate(
    "the tempo is still the manner channel's first float",
    Math.abs(before.tempo - (1 + 0.14 * (2 * first - 1))) <= 1e-12 &&
      before.tempo !== 1,
  );
  TestValidator.predicate(
    "a slot keyed like a channel draws its own value",
    slots[4] !== slots[3] &&
      source.series("manner").random.float(0) !== first,
  );
}
