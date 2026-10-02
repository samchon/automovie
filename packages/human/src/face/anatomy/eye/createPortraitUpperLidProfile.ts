import { polygonIsSimple } from "@automovie/engine";

import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { createPortraitLidSectionSampler } from "./createPortraitLidSectionSampler";
import { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import { IPortraitUpperLidProfile } from "./structures/IPortraitUpperLidProfile";
import { IPortraitUpperLidSection } from "./structures/IPortraitUpperLidSection";

/**
 * Own and interpolate upper tissue without duplicating the lower lid's numerical
 * interpolation. Shared smoothstep interpolates each longitudinal witness.
 * Explicit closed sections permit a returning hood and supply its unfolding
 * target without changing the outer skin attachment or station identities.
 *
 * Without closed sections the profile is the shared sampler over the observed
 * sections. With them, the current closure is
 * `(blink - observedBlink) / (1 - observedBlink)`, the section is the linear
 * blend from the observed to the closed section by that fraction, and each
 * blended section is checked again because an unfold or a further opening
 * extrapolates. Closed sections must have the same witnesses and the same
 * attachment distances as the observed ones. Offsets and projections are
 * millimetres in the lid's section frame. With closed sections, a performance outside its ranges,
 * mismatched sections and a blended or extrapolated section that leaves its
 * finite, inward, simple form throw.
 *
 * @evidence contracts/common.md#principled-implementation A linear blend between two admitted sections at a fraction of closure is the unfolding path, and because the blend of two simple curves can cross itself, every blended or extrapolated section is checked for finiteness, inward order and self-intersection instead of assumed. Dividing by (1 - observedBlink) makes the observed section the fraction-zero state whatever closure it already carried, which the performance admission's 0.95 ceiling keeps finite.
 * @evidence contracts/common.md#clear-and-simple-design One function chooses between the observed sampler and a blended one, and delegates witness validation and interpolation to the shared sampler and the section check to one local validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The profile is a function of its sections and the performance only; no case is named after a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states both regimes, the closure fraction, the recheck and why, the required correspondence of the closed sections, the units and what throws.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the lid's section frame, with the polygon test done in metres by scaling by exactly 0.001, an explicit local conversion for the shared engine predicate that is never rendered.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function builds a sampler over section witnesses and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines no channel; the section fields are declared by the section types and the closure by the performance record.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; its validation polygon is an auxiliary query that is never rendered.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the outer skin attachment stays fixed and is owned by the eye and the host.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the upper lid built from it is observed under the eye component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; it interpolates the sections its caller supplies.
 */
export function createPortraitUpperLidProfile(
  input: IPortraitUpperLidProfile,
  performance?: IPortraitEyePerformance,
): (at: number) => IPortraitUpperLidSection {
  if (input.closedSections === undefined)
    return createPortraitLidSectionSampler(input.sections, roles, "Upper-lid");
  if (performance !== undefined) assertPortraitEyePerformance(performance);
  const observed = createPortraitLidSectionSampler(
    input.sections,
    roles,
    "Upper-lid",
    assertFoldedSection,
  );
  const closed = createPortraitLidSectionSampler(
    input.closedSections,
    roles,
    "Upper-lid",
  );
  if (
    input.sections.length !== input.closedSections.length ||
    input.sections.some(
      (witness, i) =>
        witness.at !== input.closedSections![i].at ||
        witness.section.attachment !==
          input.closedSections![i].section.attachment,
    )
  )
    throw new Error(
      "Upper-lid unfolding needs the same witnesses and fixed attachment distances.",
    );
  const closure =
    performance === undefined
      ? 0
      : (performance.blink - performance.observedBlink) /
        (1 - performance.observedBlink);
  if (closure === 0) return observed;
  return (at) => {
    const from = observed(at),
      to = closed(at);
    for (const role of roles) {
      from[role].offset += closure * (to[role].offset - from[role].offset);
      from[role].projection +=
        closure * (to[role].projection - from[role].projection);
    }
    assertFoldedSection(from);
    return from;
  };
}

/** Check the explicit transverse skin curve, not a head-wide collision claim. */
function assertFoldedSection(section: IPortraitUpperLidSection): void {
  let previous = 0;
  for (const role of roles) {
    const point = section[role];
    if (
      !Number.isFinite(point.offset) ||
      !Number.isFinite(point.projection) ||
      point.offset <= 0 ||
      point.offset >= section.attachment
    )
      throw new Error(
        "Upper-lid folded tissue must remain finite inside its attachment.",
      );
    if (role === "hood") continue;
    if (point.offset <= previous)
      throw new Error(
        "Upper-lid folding only permits the hood to return inward.",
      );
    previous = point.offset;
  }
  if (
    section.hood.offset <= section.margin.offset ||
    section.hood.offset >= section.preseptal.offset
  )
    throw new Error(
      "Upper-lid hood must remain between margin and preseptal skin.",
    );
  const floor =
    Math.min(0, ...roles.map((role) => section[role].projection)) - 1;
  // Close below the entire tissue curve. This auxiliary edge is only for the
  // engine's shared metre-space intersection predicate; it is never rendered.
  const polygon = [
    { x: 0, y: 0 },
    ...roles.map((role) => ({
      x: section[role].offset / 1000,
      y: section[role].projection / 1000,
    })),
    { x: section.attachment / 1000, y: 0 },
    { x: section.attachment / 1000, y: floor / 1000 },
    { x: 0, y: floor / 1000 },
  ];
  if (!polygonIsSimple(polygon))
    throw new Error("Upper-lid folded tissue must not cross or touch itself.");
}

const roles = [
  "margin",
  "tarsal",
  "creaseInner",
  "creaseOuter",
  "hood",
  "preseptal",
] as const;
