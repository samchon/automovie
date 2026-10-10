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
