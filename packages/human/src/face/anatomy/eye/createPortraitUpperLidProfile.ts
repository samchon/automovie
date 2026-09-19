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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies the eye's independent upper tissue section from authored anatomical witnesses.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Keeps the ordinary ordered sampler and validates explicit folded transverse sections with a fixed outer attachment.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Unfolds the same named upper tissue stations from observed closure toward an authored closed section.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Uses observed-relative closure without changing optical dimensions or inferring hidden tissue from a photograph.
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
