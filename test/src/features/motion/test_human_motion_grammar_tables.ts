import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanVariation,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The whole lexicon registers in one performance, and a seed is a take:
 * the same composition differs under different seeds and repeats under one.
 *
 * A film's crowd must not move as clones, so people given one action differ
 * by seed, and a re-render must not change a frame, so one seed is one
 * take. A lexicon whose rows collided with the vocabulary or with each other
 * could not be offered to a production as one registration.
 *
 * Scenarios, on the average man:
 * 1. A performance given every row of the lexicon at once builds: no row
 *    takes a vocabulary name or another row's name.
 * 2. Registering one row twice refuses the performance, naming it.
 * 3. A wave with variation, read as the film second its stroke starts, over
 *    24 seeds: at least 12 distinct values, a spread above a millisecond,
 *    and every value within 0.5 s of the mean (a preparation is a fraction
 *    of a second; the 0.5 s is provisional).
 * 4. The same reading under one seed 3 times is one value.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public input with the whole lexicon and under many seeds and reads placed instants; a colliding row, clones across seeds or a changed re-render fails.
 * @evidence contracts/development/testing.md#independent-expectations That a name means one action, that seeds differ and that one seed repeats follow from what registration and a seed are; the 0.5 s bound is a human preparation's order of magnitude, marked provisional, and limits only gross errors.
 * @evidence contracts/development/testing.md#distinguishing-cases The whole table and a doubled row; many seeds and one seed. What each row shows is owned by the lexicon net and the signature tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test on one prepared polygon man with in-memory performances; no host is started.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_grammar_tables(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const complaints: string[] = [];
  const perform = (
    seed: string,
    registered: readonly IHumanActionLaw<never>[],
  ): HumanPerformance =>
    new HumanPerformance({
      seed,
      laws: registered,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .gesture({ kind: "wave", manner: { variation: 1 } }).node,
    });
  const stroke = (seed: string): number => {
    const wave: HumanSegment.ISegment = perform(seed, laws).segments("a")[1]!;
    const share: number =
      wave.plan.events.find(
        (event: { name: string; share: number }): boolean =>
          event.name === "strokeStart",
      )?.share ?? Number.NaN;
    return wave.start + share * wave.plan.duration;
  };

  // 1. The whole lexicon at once.
  try {
    perform("whole", laws);
  } catch (error) {
    complaints.push(
      `the whole lexicon does not register: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 2. A doubled row.
  let thrown: unknown = null;
  try {
    perform("doubled", [...laws, laws[0]!]);
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof HumanRefusal && thrown.value === laws[0]!.name))
    complaints.push(
      `a row registered twice: expected a refusal naming ${laws[0]!.name}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  // 3. Seeds are takes.
  const takes: HumanVariation.IReport = HumanVariation.over(24, stroke);
  if (!(takes.distinct >= 12 && takes.deviation > 0.001))
    complaints.push(
      `over 24 seeds a varied wave's stroke starts at ${takes.distinct} distinct seconds with a spread of ${(takes.deviation * 1000).toFixed(2)} ms; at least 12 and over 1 ms expected`,
    );
  if (
    takes.maximum.value - takes.mean > 0.5 ||
    takes.mean - takes.minimum.value > 0.5
  )
    complaints.push(
      `a varied wave's stroke starts between ${takes.minimum.value.toFixed(3)} s (${takes.minimum.seed}) and ${takes.maximum.value.toFixed(3)} s (${takes.maximum.seed}) around ${takes.mean.toFixed(3)} s; within 0.5 s expected`,
    );

  // 4. One seed is one take.
  const same: HumanVariation.IReport = HumanVariation.over(
    ["take", "take", "take"],
    stroke,
  );
  // The same take read again is the same number exactly; its deviation is
  // computed through a mean and may round off zero, so the ends are compared.
  if (same.distinct !== 1 || same.minimum.value !== same.maximum.value)
    complaints.push(
      `one seed read three times gives ${same.distinct} values, from ${same.minimum.value} to ${same.maximum.value}`,
    );

  TestValidator.equals("the lexicon and the seed", complaints, []);
}
