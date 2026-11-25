import { HumanRefusal, armPhrase } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

/** A free phrase can use either or both hands. A named point needs its prop. */
export function test_unit_motions_everyday_arm_phrase(): void {
  assert.deepEqual(armPhrase.selectHands({}, {}), ["right"]);
  assert.deepEqual(
    armPhrase.selectHands({ hand: "both" }, {}),
    ["left", "right"],
  );
  assert.deepEqual(
    armPhrase.selectHands(
      { hand: "left", held: "chalk", point: "tip" },
      { left: "chalk" },
    ),
    ["left"],
  );
  assert.throws(
    () =>
      armPhrase.selectHands({ hand: "left", held: "chalk" }, { right: "chalk" }),
    refuses("held"),
  );
  assert.throws(
    () =>
      armPhrase.selectHands({ hand: "both", held: "chalk" }, { left: "chalk" }),
    refuses("held"),
  );
  assert.throws(
    () => armPhrase.selectHands({ point: "tip" }, {}),
    refuses("point"),
  );
}

/** Match the refused input at the primitive's boundary. */
function refuses(axis: string): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof HumanRefusal && error.axis === axis;
}
