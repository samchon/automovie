import { createPortraitColourField } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { skinColourField } from "../internal/skinColourFixture";

/**
 * The colour envelope is reference-bound and independent of declaration order.
 * It is the kernel every colour path shares; the named-site resolution has its own scenario file.
 *
 * Scenarios:
 * 1. Hand-calculated centre, half-radius, boundary and exterior RGB values
 *    distinguish the quartic kernel from linear or world-space paint.
 * 2. Empty, zero-strength and white-gain fields are identities; very small
 *    radial offsets remain bounded despite kernel roundoff.
 * 3. The sampler owns its region and reference inputs, and reversing distinct
 *    names preserves multiplication order and values.
 */
export const test_subject_skin_colour_sampler = (): void => {
  const region = skinColourField(),
    sample = createPortraitColourField([region]);
  const close = (point: number[], expected: number[]) =>
    sample(point).every((v, i) => nclose(v, expected[i], 1e-12));
  TestValidator.predicate(
    "centre and half-radius oracle",
    close([0, 0, 0], [0.9, 0.8, 0.7]) &&
      close([1, 0, 0], [0.98125, 0.9625, 0.94375]),
  );
  TestValidator.equals("boundary identity", sample([2, 0, 0]), [1, 1, 1]);
  TestValidator.equals("exterior identity", sample([3, 0, 0]), [1, 1, 1]);
  TestValidator.equals(
    "empty identity",
    createPortraitColourField([])([0, 0, 0]),
    [1, 1, 1],
  );
  for (const change of [
    { strength: 0 },
    { gain: [1, 1, 1] as [number, number, number] },
  ])
    TestValidator.equals(
      "identity field",
      createPortraitColourField([{ ...region, ...change }])([0, 0, 0]),
      [1, 1, 1],
    );
  const saturated = createPortraitColourField([
    { ...region, gain: [0, 0, 0], strength: 1 },
  ]);
  for (const x of [0, 1e-16, 1e-12, 1e-8])
    TestValidator.predicate(
      "near-centre bounded",
      saturated([x, 0, 0]).every((v) => v >= 0 && v <= 1),
    );
  const other = {
    ...region,
    name: "another",
    gain: [0.2, 0.3, 0.4] as [number, number, number],
  };
  TestValidator.equals(
    "order independent",
    createPortraitColourField([region, other])([1, 0, 0]),
    createPortraitColourField([other, region])([1, 0, 0]),
  );
  region.gain[0] = 0;
  region.radius[0] = 100;
  region.center[0] = 100;
  TestValidator.predicate(
    "owned input basis",
    close([0, 0, 0], [0.9, 0.8, 0.7]),
  );
  for (const point of [
    [0, 0],
    [NaN, 0, 0],
    [0, Infinity, 0],
  ])
    TestValidator.predicate(
      "invalid sample refused",
      throwsError(() => sample(point), "finite reference XYZ"),
    );
};
