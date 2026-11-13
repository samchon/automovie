import {
  HUMAN_ACTIONS,
  HUMAN_GRAMMAR,
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanVariation,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The grammar and the lexicon are readable as data, and a seed is a take:
 * the tables name every axis, operator and row once, a row's name never
 * collides with the vocabulary or another row, and the same composition
 * under different seeds differs while under one seed it does not.
 *
 * A film's crowd must not move as clones (people given one action differ),
 * and a re-render must not change a frame; both are properties of the seed.
 *
 * Scenarios:
 * 1. The grammar names the eleven axes and the eight operators the
 *    scaffold's motion skill teaches, each once, each with what carries it.
 * 2. Every row of the lexicon table has a name of its own: none is a
 *    vocabulary name and none appears in two families, so the whole table
 *    registers in one performance.
 * 3. A wave with variation, read as the film second its stroke starts,
 *    over 24 seeds on the average man: at least 12 distinct values, a
 *    spread above a millisecond, and every value within 0.5 s of the mean
 *    (a preparation is a fraction of a second; the bound is provisional).
 * 4. The same reading under one seed 3 times is one value.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exported tables and builds performances through the public input under many seeds; a missing or doubled name, a colliding row, clones across seeds or a changed re-render fails.
 * @evidence contracts/development/testing.md#independent-expectations The axis and operator names are the composition grammar's own list (issue #3354, taught by the scaffold's motion skill); distinctness and repeatability follow from what a seed is.
 * @evidence contracts/development/testing.md#distinguishing-cases Both tables, name collisions in two directions, many seeds and one seed.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds 27 short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_grammar_tables(): void {
  const complaints: string[] = [];
  const sorted = (names: readonly string[]): string[] =>
    [...names].sort((x: string, y: string): number => x.localeCompare(y));

  // 1. The grammar's names.
  TestValidator.equals(
    "the axes",
    sorted(HUMAN_GRAMMAR.axes.map((axis): string => axis.name)),
    sorted([
      "base",
      "travel",
      "action",
      "effector",
      "target",
      "object",
      "partner",
      "manner",
      "layer",
      "timing",
      "seed",
    ]),
  );
  TestValidator.equals(
    "the operators",
    sorted(HUMAN_GRAMMAR.operators.map((operator): string => operator.name)),
    sorted([
      "sequence",
      "cut",
      "overlay",
      "layer",
      "parallel",
      "mutual",
      "attach",
      "sync",
    ]),
  );
  for (const entry of [...HUMAN_GRAMMAR.axes, ...HUMAN_GRAMMAR.operators])
    if (entry.carriedBy.length === 0 || entry.says.length === 0)
      complaints.push(`${entry.name} names nothing that carries it`);

  // 2. Every row has a name of its own.
  const seen: Map<string, string> = new Map();
  for (const [family, rows] of Object.entries(HUMAN_LEXICON)) {
    if (rows.length === 0) complaints.push(`the family ${family} is empty`);
    for (const row of rows) {
      if (row.name in HUMAN_ACTIONS)
        complaints.push(`${family}.${row.name} is a vocabulary name`);
      const other: string | undefined = seen.get(row.name);
      if (other !== undefined)
        complaints.push(`${row.name} is in both ${other} and ${family}`);
      seen.set(row.name, family);
    }
  }
  const body: IHumanBody = motionHumanBody("m-average");
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const stroke = (seed: string): number => {
    const performance: HumanPerformance = new HumanPerformance({
      seed,
      laws,
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
    const wave = performance.segments("a")[1]!;
    return (
      wave.start +
      wave.plan.events.find((e): boolean => e.name === "strokeStart")!.share *
        wave.plan.duration
    );
  };

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
  if (same.distinct !== 1 || same.deviation !== 0)
    complaints.push(`one seed read three times gives ${same.distinct} values`);

  TestValidator.equals("the tables and the seed", complaints, []);
}
