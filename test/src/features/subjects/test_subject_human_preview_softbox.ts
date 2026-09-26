import { humanPreviewSoftbox } from "@automovie/playground/src/human/previewSoftbox";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A preview key light sampled as a round source of equal solid-angle shares.
 *
 * Scenarios:
 * 1. Eight samples of a source of half angle atan(1/3) around the preview's
 *    key direction keep its length, lie within the half angle, and their
 *    polar angles hold (k + 1/2)/8 of the cap's solid angle in turn; their
 *    mean points along the key.
 * 2. One sample is the centre of its single share's cap, and a source
 *    straight along an axis is sampled too.
 * 3. A direction without length, a half angle of zero or a right angle, and
 *    a count that is not a positive integer refuse.
 */
export const test_subject_human_preview_softbox = (): void => {
  const key = [-0.3, 0.35, 0.45] as const;
  const length = Math.hypot(...key);
  const half = Math.atan(1 / 3);
  const samples = humanPreviewSoftbox(key, half, 8);
  const angle = (a: readonly number[]) =>
    Math.acos(
      Math.min(
        1,
        (a[0]! * key[0] + a[1]! * key[1] + a[2]! * key[2]) /
          (Math.hypot(...a) * length),
      ),
    );
  const cap = 1 - Math.cos(half);
  const mean = [0, 1, 2].map(
    (axis) => samples.reduce((sum, one) => sum + one[axis]!, 0) / 8,
  );
  TestValidator.predicate(
    "shares",
    samples.length === 8 &&
      samples.every((one) => nclose(Math.hypot(...one), length, 1e-12)) &&
      samples.every(
        (one, k) =>
          angle(one) <= half &&
          nclose(1 - Math.cos(angle(one)), ((k + 0.5) / 8) * cap, 1e-9),
      ) &&
      angle(mean) < 0.02,
  );
  const [single] = humanPreviewSoftbox(key, half, 1);
  const axial = humanPreviewSoftbox([0, 0, 2], 0.3, 4);
  TestValidator.predicate(
    "single and axial",
    nclose(1 - Math.cos(angle(single!)), 0.5 * cap, 1e-9) &&
      axial.every(
        (one) =>
          nclose(Math.hypot(...one), 2, 1e-12) &&
          Math.acos(one[2]! / 2) <= 0.3 + 1e-12,
      ),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(() => humanPreviewSoftbox([0, 0, 0], half, 8), "length") &&
      throwsError(() => humanPreviewSoftbox(key, 0, 8), "half angle") &&
      throwsError(
        () => humanPreviewSoftbox(key, Math.PI / 2, 8),
        "half angle",
      ) &&
      throwsError(() => humanPreviewSoftbox(key, half, 0), "one sample") &&
      throwsError(() => humanPreviewSoftbox(key, half, 2.5), "one sample"),
  );
};
