import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import {
  HumanArchery,
  HumanBoltAction,
  HumanGunDrill,
  HumanMusketDrill,
  HumanRevolver,
  HumanThrownWeapon,
  HumanWeaponFirearm,
  HumanWeaponPresent,
  operate,
  release,
  throwObject,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The launcher rows (#3487 to #3490) are data over shipped laws: each names
 * its family, fixes only what its table says, and plans with its family's
 * plan; the firearm's present and fire are the launcher laws under their
 * firearm names (#3491).
 *
 * Scenarios:
 * 1. Every row of the six lexicons is a law whose family is one of the
 *    shipped laws it is documented as a row of, and whose name is unique
 *    across them.
 * 2. `presentBow` fixes the face anchor, one hand, the line from the `nock`
 *    through the `rest` tip, the `grip` edge and the extended bow arm, as
 *    its row documents them; `presentCrossbow` the cheek anchor.
 * 3. `throwJavelin` and `throwSpear` fix the overarm style, the velocity
 *    attitude and the middle of Campos, Brizuela and Ramón's release band,
 *    (27.7 + 40.1) / 2 degrees.
 * 4. `loose`, `dropMagazine` are rows of `release`; `drawBow`,
 *    `spanCrossbow`, `ramDown`, `cockRevolver`, `drawBolt` and `pullLanyard`
 *    rows of `operate`; `hurlBottle` a row of `throwObject`.
 * 5. `HumanWeaponFirearm.present` and `.fire` keep the names
 *    `presentFirearm` and `fireFirearm` and plan with `HumanWeaponPresent`'s
 *    own plan functions.
 * 6. A row's resolved parameters let the composition's own override none of
 *    the fixed ones: `presentBow` given `anchor: "eye"` still resolves to
 *    `face`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the rows' law records and resolves their parameters; a row of the wrong law, a lost fixed parameter, a duplicate name or a firearm law with a second plan fails.
 * @evidence contracts/development/testing.md#independent-expectations The families and fixed parameters are the issues' tables; the javelin angle is the cited band's middle written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Rows of operate, release, throwObject and the launcher laws; fixed and given parameters.
 * @evidence contracts/development/testing.md#execution-ownership Reads the law records in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios.
 */
export function test_human_motion_launcher_rows(): void {
  const lexicons: Record<string, object> = {
    HumanArchery,
    HumanBoltAction,
    HumanGunDrill,
    HumanMusketDrill,
    HumanRevolver,
    HumanThrownWeapon,
  };
  const rows: IAutoMovieMotionHumanActionLaw<never>[] = Object.values(
    lexicons,
  ).flatMap((lexicon: object): IAutoMovieMotionHumanActionLaw<never>[] =>
    Object.values(lexicon).filter(
      (value: unknown): value is IAutoMovieMotionHumanActionLaw<never> =>
        typeof value === "object" && value !== null && "plan" in value,
    ),
  );
  const shipped: ReadonlySet<string> = new Set([
    "operate",
    "release",
    "throwObject",
    "pickUp",
    "putDown",
    "touch",
    "handOver",
    "walk",
    "presentWeapon",
    "fireWeapon",
  ]);

  // 1. Families and names.
  TestValidator.predicate(
    `every row is a row of a shipped law (${rows
      .filter((r) => !shipped.has(r.family ?? ""))
      .map((r) => r.name)
      .join(", ")})`,
    rows.every((r) => r.family !== undefined && shipped.has(r.family)),
  );
  TestValidator.equals(
    "every row's name is unique",
    new Set(rows.map((r) => r.name)).size,
    rows.length,
  );

  // 2. The presenting rows.
  TestValidator.equals(
    "presentBow fixes the face, one hand, the line from the nock through the rest, the grip and the extended bow arm",
    HumanArchery.presentBow.resolve!({}),
    {
      anchor: "face",
      hands: 1,
      from: "nock",
      tip: "rest",
      edge: "grip",
      extended: true,
    },
  );
  TestValidator.equals(
    "presentCrossbow fixes the cheek",
    HumanArchery.presentCrossbow.resolve!({}),
    { anchor: "cheek" },
  );

  // 3. The javelin's release.
  for (const row of [
    HumanThrownWeapon.throwJavelin,
    HumanThrownWeapon.throwSpear,
  ])
    TestValidator.equals(
      `${row.name} fixes the overarm style, the velocity attitude and the band's middle`,
      row.resolve!({}),
      {
        style: "overarm",
        angle: (27.7 + 40.1) / 2,
        attitude: { kind: "velocity" },
      },
    );

  // 4. Families of named rows.
  const family = (
    law: IAutoMovieMotionHumanActionLaw<never>,
  ): string | undefined => law.family;
  TestValidator.predicate(
    "loose and dropMagazine are releases",
    family(HumanArchery.loose as IAutoMovieMotionHumanActionLaw<never>) ===
      release.name &&
      family(
        HumanBoltAction.dropMagazine as IAutoMovieMotionHumanActionLaw<never>,
      ) === release.name,
  );
  TestValidator.predicate(
    "the drawing, spanning, ramming, cocking, bolt and lanyard rows operate",
    [
      HumanArchery.drawBow,
      HumanArchery.spanCrossbow,
      HumanMusketDrill.ramDown,
      HumanRevolver.cock,
      HumanBoltAction.drawBolt,
      HumanGunDrill.pullLanyard,
    ].every(
      (law) =>
        family(law as IAutoMovieMotionHumanActionLaw<never>) === operate.name,
    ),
  );
  TestValidator.predicate(
    "hurlBottle throws",
    family(
      HumanThrownWeapon.hurlBottle as IAutoMovieMotionHumanActionLaw<never>,
    ) === throwObject.name,
  );

  // 5. The firearm's names over the launcher's plans.
  TestValidator.predicate(
    "the firearm laws keep their names and plan with the launcher's plans",
    HumanWeaponFirearm.present.name === "presentFirearm" &&
      HumanWeaponFirearm.fire.name === "fireFirearm" &&
      HumanWeaponFirearm.present.plan === HumanWeaponPresent.present.plan &&
      HumanWeaponFirearm.fire.plan === HumanWeaponPresent.fire.plan,
  );

  // 6. A fixed parameter is not overridden.
  TestValidator.equals(
    "a given anchor does not override the bow's face",
    (HumanArchery.presentBow.resolve!({ anchor: "eye" }) as { anchor: string })
      .anchor,
    "face",
  );
}
