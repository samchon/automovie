import { TestValidator } from "@nestia/e2e";

import { faceShoulderDrops } from "../../../scripts/face-review/faceShoulderDrops";
import { throwsError } from "../internal/predicates";

const row = (
  stature: number,
  mentonSellion: number,
  acromial: number,
  notch: number,
): Record<string, string> => ({
  stature: String(stature),
  sittingheight: "900",
  eyeheightsitting: "780",
  mentonsellionlength: String(mentonSellion),
  acromialheight: String(acromial),
  suprasternaleheight: String(notch),
});

/**
 * The shoulder drop is measured from an estimated menton.
 *
 * Scenarios:
 * 1. Menton is stature less the head above the eye (900 - 780 = 120) less menton
 *    to sellion: 1700 - 120 - 120 = 1460 and 1800 - 120 - 130 = 1550. The
 *    acromion at 1400 and 1470 drops 60 and 80 (mean 70, deviation 14.1); the
 *    notch at 1380 and 1450 drops 80 and 100 (mean 90, deviation 14.1).
 * 2. A missing column, an empty value and a non-numeric value each refuse and
 *    name the column.
 */
export const test_subject_face_shoulder_drops = (): void => {
  const drops = faceShoulderDrops([
    row(1700, 120, 1400, 1380),
    row(1800, 130, 1470, 1450),
  ]);
  TestValidator.equals("acromion", drops.acromion, {
    subjects: 2,
    mean: 70,
    sd: 14.1,
  });
  TestValidator.equals("notch", drops.suprasternale, {
    subjects: 2,
    mean: 90,
    sd: 14.1,
  });
  const valid = row(1700, 120, 1400, 1380);
  const without = { ...valid };
  delete without.acromialheight;
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => faceShoulderDrops([valid, without]),
      "numeric acromialheight",
    ) &&
      throwsError(
        () => faceShoulderDrops([valid, { ...valid, stature: "" }]),
        "numeric stature",
      ) &&
      throwsError(
        () => faceShoulderDrops([valid, { ...valid, stature: "tall" }]),
        "numeric stature",
      ),
  );
};
