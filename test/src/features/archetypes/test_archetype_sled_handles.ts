import { createSled } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A push sled's `left` and `right` handles are the pusher's left and right
 * hand's: the pusher stands behind the sled at `-Z` facing `+Z`, where `+X`
 * is the pusher's left, so the `left` handle lies at `+X` and the `right` one
 * at `-X`, mirrored across the sled's middle.
 *
 * Scenarios, at the middle of the bands and over 20 seeds:
 * 1. The `left` handle's place has a positive `x`, the `right` handle's a
 *    negative one.
 * 2. The two are mirrored: their `x` sum to zero within a micrometre, and
 *    their heights and depths agree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the sled through its public producer and reads its declared handles; a handle named for one hand on the other hand's side, which crosses the pusher's arms, fails with the seed and the places.
 * @evidence contracts/development/testing.md#independent-expectations The side is the frame's convention stated here, the pusher's left at `+X` facing `+Z`, not read from the producer.
 * @evidence contracts/development/testing.md#distinguishing-cases Both handles, the middle of the bands and seeds that draw other spacings.
 * @evidence contracts/development/testing.md#execution-ownership Builds 21 sleds in memory; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame's convention and the 2 scenarios.
 */
export function test_archetype_sled_handles(): void {
  const complaints: string[] = [];
  const seeds: (number | undefined)[] = [
    undefined,
    ...Array.from({ length: 20 }, (_: unknown, i: number): number => i),
  ];
  for (const seed of seeds) {
    const sled: ReturnType<typeof createSled> = createSled({}, seed);
    const left: IAutoMovieVector3 = sled.affordance("left").frame.translation;
    const right: IAutoMovieVector3 = sled.affordance("right").frame.translation;
    if (!(left.x > 0 && right.x < 0))
      complaints.push(
        `seed ${seed}: the left handle at x ${left.x.toFixed(3)} and the right at x ${right.x.toFixed(3)}, the left at +x expected`,
      );
    if (
      !(
        nclose(left.x, -right.x) &&
        nclose(left.y, right.y) &&
        nclose(left.z, right.z)
      )
    )
      complaints.push(`seed ${seed}: the handles are not mirrored across x`);
  }
  TestValidator.equals("the handles are the pusher's hands'", complaints, []);
}
