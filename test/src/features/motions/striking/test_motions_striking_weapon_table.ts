import {
  StrikingWeaponTable
} from "../../../../../packages/motions/src/striking/internal/StrikingWeaponTable";
import { TestValidator } from "@nestia/e2e";

/**
 * A striking weapon table's reader (`StrikingWeaponTable.reader`): it solves
 * the limb's ends at a second and keeps the seeds the solve hands back, none
 * when it hands none.
 *
 * Scenario: a solve handing back seeds returns its ends with those very seeds;
 * one handing none returns empty seeds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the virtual limb table reader's preservation of optional caller-owned solve seeds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the reader on one solve carrying seeds and another solve with only endpoint positions.
 * @evidence contracts/development/testing.md#independent-expectations The returned endpoints keep the stated seed identity when supplied, and an omitted evaluation seed yields the empty value.
 */
export function test_motions_striking_weapon_table(): void {
  const seeds: ReturnType<StrikingWeaponTable.IRead>["seeds"] = {};
  const kept: StrikingWeaponTable.IRead = StrikingWeaponTable.reader(
    (seconds, _near, keep) => {
      keep(seeds);
      return [{ x: seconds, y: 0, z: 0 }];
    },
  );
  const none: StrikingWeaponTable.IRead = StrikingWeaponTable.reader(
    (seconds) => [{ x: seconds, y: 0, z: 0 }],
  );
  TestValidator.predicate(
    "the seeds",
    kept(2).seeds === seeds &&
      kept(2).ends[0]!.x === 2 &&
      StrikingWeaponTable.STEP === 1 / 120,
  );
  TestValidator.equals("no seeds", none(1).seeds, {});
}
