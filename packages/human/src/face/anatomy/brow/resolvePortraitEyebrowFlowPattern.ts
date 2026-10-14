import type { IPortraitEyebrowFlowPattern } from "./IPortraitEyebrowFlowPattern";
import type { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Expand the four-number brow grain into the direction witnesses the flow
 * owner interpolates.
 *
 * Three witnesses are produced, at the medial end, at the end of the head (three tenths of the boundary's longitudinal parameter, not physical arc length) and at the lateral end. At the medial end a hair rooted at the lower border ends at `headTip` and one rooted at the upper border at the upper boundary, both with the head's sweep, which is the upward fan. At the other two witnesses hairs of both borders end at `convergence` with the body's sweep, so a hair rooted above that fraction runs down and one rooted below it runs up. This is the one place the pattern becomes witnesses; the conversion has no inverse, because a witness list can state patterns the four numbers cannot.
 *
 * A fraction outside [0,1] or a non-finite sweep refuses.
 *
 * @evidence contracts/common.md#principled-implementation Three witnesses expand the four authored grain values into a medial fan and shared body/tail convergence at stations zero, 0.3 and one.
 * @evidence contracts/common.md#clear-and-simple-design This single forward conversion hands complete witnesses to the flow interpolation owner; it does not implement an inverse for unrestricted profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range fractions and non-finite sweeps refuse; the three-tenths split is an explicit construction convention rather than an observed direction field.
 * @evidence contracts/common.md#meaningful-documentation The prose explains upper/lower tips, sweep ownership, complete stations and the noninvertible representation boundary.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar validations and three witness records require constant time and output space.
 * @evidence contracts/performance.md#reuse-equivalent-work Placement resolution reuses this canonical grain expansion before the shared flow sampler copies/adopts it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned three-section profile survives; shared local body directions alias within that result and no external state or resource is retained.
 */
export function resolvePortraitEyebrowFlowPattern(
  pattern: IPortraitEyebrowFlowPattern,
): IPortraitEyebrowFlowProfile {
  if (
    ![pattern.headTip, pattern.convergence].every(
      (value: number): boolean =>
        Number.isFinite(value) && value >= 0 && value <= 1,
    ) ||
    ![pattern.headSweepMm, pattern.sweepMm].every(Number.isFinite)
  )
    throw new Error(
      "Eyebrow grain needs tip fractions in [0,1] and finite sweeps.",
    );
  const body: {
    lower: { tip: number; outwardBend: number };
    upper: { tip: number; outwardBend: number };
  } = {
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
