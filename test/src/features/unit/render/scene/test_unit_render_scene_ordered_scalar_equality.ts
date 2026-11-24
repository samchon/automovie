import { equalOrderedScalars } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** The two shapes the planned audio identity actually compares. */
const MONO_SPEAKERS: readonly ["front-center"] = ["front-center"] as const;
const STEREO_SPEAKERS: readonly ["front-left", "front-right"] = [
  "front-left",
  "front-right",
] as const;
const MONO_MATRIX: readonly [readonly [1]] = [[1]] as const;
const STEREO_MATRIX: readonly [readonly [0.5, 0.5]] = [[0.5, 0.5]] as const;

/**
 * The plan's audio identity check compares ordered arrays, not objects.
 *
 * `validWaveAudioIdentity` asks two questions of a declared WAVE asset: does its speaker layout match the layout its channel count implies, and does its downmix matrix match the recipe that channel count implies. Both comparands are ordered and hold only numbers or strings, so the predicate that answers them is an ordered-array comparison rather than `node:util`'s `isDeepStrictEqual`, which accepted any value and also decided prototypes, symbol keys, boxed primitives and cycles. This pins the replacement's declared domain, including the part of the old behavior that is deliberately kept and the part that is deliberately refused.
 *
 * Scenarios:
 *
 * 1. The real comparands agree with themselves: both speaker layouts and both downmix matrices, nested one level.
 * 2. Order is significant, so a stereo layout with its channels swapped is unequal even though it holds the same two labels.
 * 3. Type is significant at the same position, so `1` and `"1"` are unequal.
 * 4. A missing element and an extra element are both unequal, on the outer array and on a nested row.
 * 5. Records are outside the domain and are refused rather than compared: two objects carrying the same entries in different key order return false, so an object cannot pass by having no `length`.
 * 6. `Object.is` decides each scalar, so `NaN` equals `NaN` and `+0` differs from `-0`, which is what the replaced predicate did for these values.
 */
export function test_unit_render_scene_ordered_scalar_equality(): void {
  TestValidator.predicate(
    "the real comparands agree with themselves",
    (): boolean =>
      [
        equalOrderedScalars(MONO_SPEAKERS, ["front-center"]),
        equalOrderedScalars(STEREO_SPEAKERS, ["front-left", "front-right"]),
        equalOrderedScalars(MONO_MATRIX, [[1]]),
        equalOrderedScalars(STEREO_MATRIX, [[0.5, 0.5]]),
      ].every((held: boolean): boolean => held),
  );

  // Twin 1: array order. The same two labels in the other order is a different
  // layout, because channel order decides which speaker a sample reaches.
  TestValidator.predicate(
    "a swapped stereo layout is unequal",
    (): boolean =>
      equalOrderedScalars(STEREO_SPEAKERS, ["front-right", "front-left"]) ===
      false,
  );

  // Twin 2: type difference at the same position.
  TestValidator.predicate(
    "a numeric coefficient and its string spelling are unequal",
    (): boolean => equalOrderedScalars([1], ["1"]) === false,
  );

  // Twin 3: a missing element, outer and nested.
  TestValidator.predicate(
    "a missing element is unequal",
    (): boolean =>
      equalOrderedScalars(STEREO_SPEAKERS, ["front-left"]) === false &&
      equalOrderedScalars(STEREO_MATRIX, [[0.5]]) === false,
  );

  // Twin 4: an extra element, outer and nested.
  TestValidator.predicate(
    "an extra element is unequal",
    (): boolean =>
      equalOrderedScalars(MONO_SPEAKERS, ["front-center", "front-left"]) ===
        false && equalOrderedScalars(MONO_MATRIX, [[1, 0]]) === false,
  );

  // Twin 5: key order, which is out of the domain. The replaced predicate would
  // have compared these as objects; this one refuses a non-array outright, so
  // the pair cannot compare equal by both lacking a length.
  const keyed: readonly number[] = {
    a: 1,
    b: 2,
  } as unknown as readonly number[];
  const reordered: readonly number[] = {
    b: 2,
    a: 1,
  } as unknown as readonly number[];
  TestValidator.predicate(
    "records are refused rather than compared",
    (): boolean =>
      equalOrderedScalars(keyed, reordered) === false &&
      equalOrderedScalars(keyed, keyed) === false,
  );

  // The two scalar semantics carried over from the replaced predicate.
}
