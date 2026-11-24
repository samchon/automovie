import { HumanClaspClearance, HumanGrip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanClaspClearance.bones` names what a clasp reads of one side: the
 * forearm, the hand and every bone of each digit the power grip closes.
 *
 * Scenario: the right side's set holds the right forearm and hand and the three
 * bones of each closing digit, nothing of the left, and is fresh on each call.
 */
export function test_unit_motions_handling_human_clasp_clearance_bones(): void {
  const set: ReadonlySet<string> = HumanClaspClearance.bones("right");
  const digits: string[] = HumanGrip.CLOSING.power.flatMap((digit) =>
    HumanGrip.bones("right", digit),
  );
  TestValidator.predicate(
    "the right side",
    set.has("rightLowerArm") &&
      set.has("rightHand") &&
      digits.every((bone: string): boolean => set.has(bone)) &&
      set.size === 2 + digits.length &&
      [...set].every((bone: string): boolean => bone.startsWith("right")) &&
      HumanClaspClearance.bones("right") !== set,
  );
}
