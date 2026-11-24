import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanChain,
} from "@automovie/interface";
import {
  HUMAN_ACTIONS,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_FAMILIES,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * Every exported law can register alongside the built-in actions under its
 * public name.
 *
 * Scenarios:
 *
 * 1. A base action's registry key identifies its law.
 * 2. Every category exports each registered law once, by object identity.
 * 3. No two entries occupy the same registration slot across categories and base
 *    actions.
 * 4. Every base action is a chain method of its own name, `give` and `stageCatch`
 *    among them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies namespace lookup and registration across all categories.
 * @evidence contracts/development/testing.md#behavioral-verification Compares the category arrays to the named exports consumers can register, and each base action to the chain method of its name and the action that method appends.
 * @evidence contracts/development/testing.md#independent-expectations Public export keys and unambiguous lookup determine valid registry slots.
 * @evidence contracts/development/testing.md#distinguishing-cases Visits base actions, independent registered laws and aliases across every category.
 * @evidence contracts/development/testing.md#execution-ownership Registers all installed declarations together on one standing performer, then verifies rejection at occupied registration slots.
 */
export function test_motion_catalogue_registry(): void {
  const names: Set<string> = new Set();
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("performer");
  for (const [name, law] of Object.entries(HUMAN_ACTIONS)) {
    TestValidator.equals(name + " base registration", law.name, name);
    TestValidator.equals(
      name + " chain method",
      typeof (chain as unknown as Readonly<Record<string, unknown>>)[name],
      "function",
    );
    names.add(name);
  }
  const appended: (composition: IAutoMovieComposition) => string | undefined = (
    composition: IAutoMovieComposition,
  ): string | undefined => {
    const last: IAutoMovieComposition | undefined =
      composition.kind === "sequence" ? composition.parts.at(-1) : composition;
    return last?.kind === "intent" ? last.intent.capability : undefined;
  };
  TestValidator.equals(
    "give appends its own action",
    appended(chain.give({ part: "head" }).node),
    "give",
  );
  TestValidator.equals(
    "stageCatch appends its own action",
    appended(chain.stageCatch({ partner: "pass", ball: "ball" }).node),
    "stageCatch",
  );
  for (const [category, spaces] of Object.entries(HUMAN_LEXICON_FAMILIES)) {
    const rows: readonly IAutoMovieMotionHumanActionLaw<never>[] =
      HUMAN_LEXICON[category]!;
    const exports: Set<unknown> = new Set(
      spaces.flatMap((space: object) => Object.values(space)),
    );
    for (const row of rows) {
      TestValidator.predicate(row.name + " named export", exports.has(row));
      TestValidator.predicate(
        row.name + " available slot",
        !names.has(row.name),
      );
      names.add(row.name);
    }
    for (const value of exports)
      if (typeof value === "object" && value !== null && "plan" in value)
        TestValidator.predicate(
          category + " exported law registration",
          rows.some((row) => row === value),
        );
  }
  for (const rows of Object.values(HUMAN_LEXICON))
    for (const row of rows) {
      if (row.resolve === undefined) continue;
      const forwarded = Object.freeze({ callerKey: row.name });
      TestValidator.equals(
        row.name + " dispatch preserves open arguments",
        row.resolve(forwarded),
        { ...row.resolve({}), callerKey: row.name },
      );
    }
  const installed: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    Object.values(HUMAN_LEXICON).flat();
  const register = (
    laws: readonly IAutoMovieMotionHumanActionLaw<never>[],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "registered-laws",
      laws,
      performers: [
        {
          subject: "performer",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("performer").stand({ hold: 1 }).node,
    });
  TestValidator.equals(
    "all public rows coexist with the base vocabulary",
    register(installed).segments("performer")[0]?.name,
    "stand",
  );
  for (const law of [installed[0]!, HUMAN_ACTIONS.walk]) {
    let rejection: unknown;
    try {
      register([...installed, law]);
    } catch (error) {
      rejection = error;
    }
    TestValidator.predicate(
      "occupied registration slot " + law.name,
      rejection instanceof HumanRefusal &&
        rejection.kind === "parameter" &&
        rejection.axis === "laws" &&
        rejection.value === law.name,
    );
  }
}
