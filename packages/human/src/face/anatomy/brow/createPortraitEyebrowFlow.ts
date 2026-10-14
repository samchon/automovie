import type { IPortraitEyebrowFlowSection } from "./IPortraitEyebrowFlowSection";

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
 * @evidence contracts/common.md#principled-implementation Cubic smoothstep along strictly increasing witnesses and linear interpolation across root-band endpoints form a convex bounded tip sampler.
 * @evidence contracts/common.md#clear-and-simple-design One admission/copy phase creates a synchronous closure whose query validates fractions and samples the owned witness list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid witness count/order/endpoints/tips/bends or query fractions refuse; caller edits cannot change the copied sampler and no flow is fitted to an expected answer.
 * @evidence contracts/common.md#meaningful-documentation The prose states two-through-32 witnesses, exact endpoint coverage, immutable-copy ownership, C1 longitudinal interpolation and collapsed-band caller convention.
 * @evidence contracts/performance.md#efficient-algorithms Creation copies and scans K witnesses, bounded by 32; each query finds its containing interval in O(K) then interpolates two scalar components.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted owned witness copy serves all subsequent queries, so later caller profile changes cannot invalidate it implicitly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains exactly its copied K sections for the caller's sampler lifetime and starts no task or handle.
 */
export function createPortraitEyebrowFlow(input: IPortraitEyebrowFlowProfile): (at: number, root: number) => IPortraitEyebrowFlowDirection  {
  const sections: readonly IPortraitEyebrowFlowSection[] = structuredClone(input.sections);
  if (
    sections.length < 2 ||
    sections.length > 32 ||
    sections[0].at !== 0 ||
    sections[sections.length - 1].at !== 1 ||
    sections.some(
      (section: IPortraitEyebrowFlowSection, index: number): boolean  =>
        !Number.isFinite(section.at) ||
        (index > 0 && section.at <= sections[index - 1].at) ||
        [section.lower, section.upper].some(
          (direction: IPortraitEyebrowFlowDirection): boolean  =>
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
        (value: number): boolean  => Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error(
        "Eyebrow flow queries need longitudinal and root-band fractions in [0,1].",
      );
    let index: number = 0;
    while (index < sections.length - 2 && at > sections[index + 1].at) index++;
    const a: IPortraitEyebrowFlowSection = sections[index],
      b: IPortraitEyebrowFlowSection = sections[index + 1];
    const t: number = (at - a.at) / (b.at - a.at),
      weight: number = t * t * (3 - 2 * t);
    const value: (key: keyof IPortraitEyebrowFlowDirection) => number = (key: keyof IPortraitEyebrowFlowDirection): number => {
      const lower: number = a.lower[key] * (1 - weight) + b.lower[key] * weight;
      const upper: number = a.upper[key] * (1 - weight) + b.upper[key] * weight;
      return lower * (1 - root) + upper * root;
    };
    return { tip: value("tip"), outwardBend: value("outwardBend") };
  };
}
