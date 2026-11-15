import {
  HumanDefence,
  HumanStrike,
  type IHumanActionLaw,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The strikes and defences as rows on the grammar (#3362): each named
 * technique is a row of the law that owns its geometry and outcome, with
 * the effector and the side fixed.
 *
 * Scenarios:
 * 1. Every strike row is a row of `punch`, `kick` or `knee`, and every
 *    defence row of `defend` or `brace`; no two rows share a name.
 * 2. Each punch row fixes its technique and hand: `jab` and `cross` the
 *    straight with the lead and the rear hand, the hooks and uppercuts
 *    their own, both sides of each.
 * 3. Each kick row fixes its technique and leg: `roundKick` and
 *    `switchKick` the round with the rear and the lead leg, `pushKick` and
 *    `teep` the push with the lead and the rear.
 * 4. Each knee row fixes its leg.
 * 5. Each defence row fixes its kind, and the composition's own kind does
 *    not override it.
 * 6. The target stays the composition's: a row resolves a given `at`
 *    through unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the rows' records and resolves their parameters; a row of the wrong law, a lost or overridden fixed parameter, a duplicate name or a swallowed target fails.
 * @evidence contracts/development/testing.md#independent-expectations The fixed parameters are #3362's table, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Punches, kicks, knees, blocks, evasions and braces; both sides of each.
 * @evidence contracts/development/testing.md#execution-ownership Reads the law records in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios.
 */
export function test_human_motion_strike_rows(): void {
  const rows = (lexicon: object): IHumanActionLaw<never>[] =>
    Object.values(lexicon).filter(
      (value: unknown): value is IHumanActionLaw<never> =>
        typeof value === "object" && value !== null && "plan" in value,
    );
  const strikes: IHumanActionLaw<never>[] = rows(HumanStrike);
  const defences: IHumanActionLaw<never>[] = rows(HumanDefence);

  // 1. Families and names.
  TestValidator.predicate(
    "every strike row is a punch, a kick or a knee",
    strikes.every((r) => ["punch", "kick", "knee"].includes(r.family ?? "")),
  );
  TestValidator.predicate(
    "every defence row is a defend or a brace",
    defences.every((r) => ["defend", "brace"].includes(r.family ?? "")),
  );
  const names: string[] = [...strikes, ...defences].map((r) => r.name);
  TestValidator.equals("every row's name is unique", new Set(names).size, names.length);

  // 2 to 4. The fixed effector and side.
  const fixed = (law: { resolve?: (given: object) => object }, given: object = {}): object =>
    law.resolve!(given);
  const table: [IHumanActionLaw<never>, object][] = [
    [HumanStrike.jab as IHumanActionLaw<never>, { technique: "straight", hand: "lead" }],
    [HumanStrike.cross as IHumanActionLaw<never>, { technique: "straight", hand: "rear" }],
    [HumanStrike.leadHook as IHumanActionLaw<never>, { technique: "hook", hand: "lead" }],
    [HumanStrike.rearHook as IHumanActionLaw<never>, { technique: "hook", hand: "rear" }],
    [HumanStrike.leadUppercut as IHumanActionLaw<never>, { technique: "uppercut", hand: "lead" }],
    [HumanStrike.rearUppercut as IHumanActionLaw<never>, { technique: "uppercut", hand: "rear" }],
    [HumanStrike.roundKick as IHumanActionLaw<never>, { technique: "round", leg: "rear" }],
    [HumanStrike.switchKick as IHumanActionLaw<never>, { technique: "round", leg: "lead" }],
    [HumanStrike.pushKick as IHumanActionLaw<never>, { technique: "push", leg: "lead" }],
    [HumanStrike.teep as IHumanActionLaw<never>, { technique: "push", leg: "rear" }],
    [HumanStrike.leadKnee as IHumanActionLaw<never>, { leg: "lead" }],
    [HumanStrike.rearKnee as IHumanActionLaw<never>, { leg: "rear" }],
  ];
  for (const [law, expected] of table)
    TestValidator.equals(`${law.name} fixes its effector and side`, fixed(law), expected);

  // 5. Defences.
  const kinds: [IHumanActionLaw<never>, string][] = [
    [HumanDefence.cover as IHumanActionLaw<never>, "cover"],
    [HumanDefence.parry as IHumanActionLaw<never>, "parry"],
    [HumanDefence.elbowBlock as IHumanActionLaw<never>, "elbowBlock"],
    [HumanDefence.highBlock as IHumanActionLaw<never>, "highBlock"],
    [HumanDefence.checkKick as IHumanActionLaw<never>, "check"],
    [HumanDefence.slip as IHumanActionLaw<never>, "slip"],
    [HumanDefence.roll as IHumanActionLaw<never>, "roll"],
    [HumanDefence.sway as IHumanActionLaw<never>, "sway"],
  ];
  for (const [law, kind] of kinds)
    TestValidator.equals(
      `${law.name} fixes its kind over the composition's`,
      (fixed(law, { kind: "slip", against: "x" }) as { kind: string }).kind,
      kind,
    );

  // 6. The target stays the composition's.
  const at = { kind: "person", subject: "b", region: "chin" };
  TestValidator.equals(
    "a strike row passes the given target through",
    (fixed(HumanStrike.jab as IHumanActionLaw<never>, { at }) as { at: object }).at,
    at,
  );
}
