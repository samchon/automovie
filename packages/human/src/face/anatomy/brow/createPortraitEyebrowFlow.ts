import { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";
import { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Own and interpolate one brow flow profile. Longitudinal cubic smoothstep and
 * linear root-band interpolation are convex, retaining bounded endpoint tips.
 * The query's root fraction is within the authored band, not the whole brow;
 * a collapsed band is sampled at one half by the fibre builder.
 *
 * The profile is copied on entry, so later edits to the caller's object do not
 * change the returned sampler. It needs two through 32 sections whose `at`
 * runs strictly increasing from exactly zero to exactly one, with every tip in
 * [0,1] and every bend finite; anything else throws before a sampler exists.
 * A query outside [0,1] on either argument throws as well. Between witnesses
 * the weight is `3t^2 - 2t^3`, which has zero slope at each witness, so the
 * flow is continuous with a continuous first derivative along the brow.
 *
 * @evidence contracts/common.md#principled-implementation The smoothstep weight lies in [0,1] and is monotone, and the lower/upper blend uses the root fraction as a second convex weight, so every interpolated tip is a convex combination of admitted witness tips and stays in [0,1]; zero slope at the witnesses removes a visible kink where two segments meet. The segment search assumes strictly increasing witnesses, which the validation establishes first.
 * @evidence contracts/common.md#clear-and-simple-design One function validates a profile once and returns a closure over its owned copy; it has no option and no state that changes after construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The flow is a function of the profile and the two query fractions only; no subject, fixture or expected answer is named and no foreign method is replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states the interpolation, the meaning of the root fraction, ownership of the copy, the validated shape of a profile, the weight formula and that invalid profiles and queries throw.
 * @evidence contracts/modeling.md#spatial-conventions Longitudinal and root positions and the tip are dimensionless fractions and the bend passes through in head millimetres, so no unit or frame is converted here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function interpolates a parameter record and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel; the profile it reads is one record for one brow.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; it interpolates the values its caller supplies.
 */
export function createPortraitEyebrowFlow(input: IPortraitEyebrowFlowProfile) {
  const sections = structuredClone(input.sections);
  if (
    sections.length < 2 ||
    sections.length > 32 ||
    sections[0].at !== 0 ||
    sections[sections.length - 1].at !== 1 ||
    sections.some(
      (section, index) =>
        !Number.isFinite(section.at) ||
        (index > 0 && section.at <= sections[index - 1].at) ||
        [section.lower, section.upper].some(
          (direction) =>
            !Number.isFinite(direction.tip) ||
            direction.tip < 0 ||
            direction.tip > 1 ||
            !Number.isFinite(direction.outwardBend),
        ),
    )
  )
    throw new Error(
      "Eyebrow flow needs two through 32 ordered sections spanning zero to one, bounded tips and finite lateral sweeps.",
    );
  return (at: number, root: number): IPortraitEyebrowFlowDirection => {
    if (
      ![at, root].every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error(
        "Eyebrow flow queries need longitudinal and root-band fractions in [0,1].",
      );
    let index = 0;
    while (index < sections.length - 2 && at > sections[index + 1].at) index++;
    const a = sections[index],
      b = sections[index + 1];
    const t = (at - a.at) / (b.at - a.at),
      weight = t * t * (3 - 2 * t);
    const value = (key: keyof IPortraitEyebrowFlowDirection): number => {
      const lower = a.lower[key] * (1 - weight) + b.lower[key] * weight;
      const upper = a.upper[key] * (1 - weight) + b.upper[key] * weight;
      return lower * (1 - root) + upper * root;
    };
    return { tip: value("tip"), outwardBend: value("outwardBend") };
  };
}
