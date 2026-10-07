import type { IPortraitEyebrowFlowPattern } from "./IPortraitEyebrowFlowPattern";
import type { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Expand the four-number brow grain into the direction witnesses the flow
 * owner interpolates.
 *
 * Three witnesses are produced, at the medial end, at the end of the head
 * (three tenths of the brow) and at the lateral end. At the medial end a hair
 * rooted at the lower border ends at `headTip` and one rooted at the upper
 * border at the upper boundary, both with the head's sweep, which is the
 * upward fan. At the other two witnesses hairs of both borders end at
 * `convergence` with the body's sweep, so a hair rooted above that fraction
 * runs down and one rooted below it runs up. This is the one place the
 * pattern becomes witnesses; the conversion has no inverse, because a
 * witness list can state patterns the four numbers cannot.
 *
 * A fraction outside [0,1] or a non-finite sweep refuses.
 *
 * @evidence contracts/common.md#principled-implementation The flow owner blends witnesses by a monotone weight along the brow and linearly across the root band, so three witnesses with equal tips across the body and tail yield the described convergence everywhere between them.
 * @evidence contracts/common.md#clear-and-simple-design One pure conversion; the flow owner and shaft builder are unchanged consumers of witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No side or subject is special-cased; invalid numbers refuse.
 * @evidence contracts/common.md#meaningful-documentation States each witness, the head division, the missing inverse and the refusal.
 * @evidence contracts/modeling.md#parameter-channels The conversion keeps each number's one trait: `headTip` and `headSweepMm` reach only the medial witness, `convergence` and `sweepMm` only the other two.
 * @evidence contracts/modeling.md#spatial-conventions Fractions and millimetres pass through unchanged.
 * @evidence contracts/anatomy.md#parametric-authority The simple pattern converts deterministically to the detailed witness list; no inverse exists because the witness list is the larger space.
 * @evidence contracts/anatomy.md#permitted-range Fractions are admitted in [0,1] and sweeps as finite numbers, the same bounds the witness admission applies.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The pattern record states the convention's source; this function carries no value.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow assembly observes the result.
 */
export function resolvePortraitEyebrowFlowPattern(
  pattern: IPortraitEyebrowFlowPattern,
): IPortraitEyebrowFlowProfile {
  if (
    ![pattern.headTip, pattern.convergence].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 1,
    ) ||
    ![pattern.headSweepMm, pattern.sweepMm].every(Number.isFinite)
  )
    throw new Error(
      "Eyebrow grain needs tip fractions in [0,1] and finite sweeps.",
    );
  const body = {
    lower: { tip: pattern.convergence, outwardBend: pattern.sweepMm },
    upper: { tip: pattern.convergence, outwardBend: pattern.sweepMm },
  };
  return {
    sections: [
      {
        at: 0,
        lower: { tip: pattern.headTip, outwardBend: pattern.headSweepMm },
        upper: { tip: 1, outwardBend: pattern.headSweepMm },
      },
      { at: 0.3, ...body },
      { at: 1, ...body },
    ],
  };
}
