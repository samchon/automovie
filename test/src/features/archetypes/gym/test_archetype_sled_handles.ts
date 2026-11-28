import { AutoMovieArchetypeSled } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
 * @evidence contracts/development/common.md#meaningful-documentation Defines the pusher's local directions and the mirroring requirements for both handles.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public sled and reads both grip contact frames for each seed. Each grip must lie on the named side and remain level and mirrored with its partner.
 * @evidence contracts/development/testing.md#independent-expectations A pusher facing model +Z has left on +X. Mirrored handles have opposing X and equal Y and Z to within the stated micrometre tolerance.
 */
export function test_archetype_sled_handles(): void {
  const complaints: string[] = [];
  const seeds: (number | undefined)[] = [
    undefined,
    ...Array.from({ length: 20 }, (_: unknown, i: number): number => i),
  ];
  for (const seed of seeds) {
    const sled: ReturnType<typeof AutoMovieArchetypeSled.create> = AutoMovieArchetypeSled.create({}, seed);
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
