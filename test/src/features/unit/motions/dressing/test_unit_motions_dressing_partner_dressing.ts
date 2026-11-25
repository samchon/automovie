import { HumanRefusal, requireHatHand } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** The hat gesture needs the selected hand free to take the brim. */
export function test_unit_motions_dressing_partner_dressing(): void {
  requireHatHand("left", undefined);
  assert.throws(
    () => requireHatHand("left", "umbrella"),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.kind === "affordance" &&
      error.axis === "hand" &&
      error.value === "left",
  );
}
