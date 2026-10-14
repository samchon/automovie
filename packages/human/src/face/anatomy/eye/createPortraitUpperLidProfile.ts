import type { IPortraitUpperLidPoint } from "./structures/IPortraitUpperLidPoint";

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
 * @evidence contracts/common.md#principled-implementation Shared witness sampling and observed-to-closed section blending retain the same station/attachment identities while explicitly admitting each returning fold.
 * @evidence contracts/common.md#clear-and-simple-design Common interpolation owns scalar witnesses; this owner adds closure-dependent folding and its simple transverse polygon admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Further opening can extrapolate, so each result is validated; section simplicity cannot substitute for whole-head collision clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives closure formula, millimetres, matched witnesses/fixed attachment and extrapolation refusals.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded witness compilations and fixed-role transverse simplicity checks dominate; each query includes both samplers and validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Observed/closed owned samplers are reused and the closure fraction is captured once; exact zero closure reuses the observed sampler.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-held closure retains copied profiles until release; per-query sections/polygons expire without external resources.
 */
export function createPortraitUpperLidProfile(
  input: IPortraitUpperLidProfile,
  performance?: IPortraitEyePerformance,
): (at: number) => IPortraitUpperLidSection {
  if (input.closedSections === undefined)
    return createPortraitLidSectionSampler(input.sections, roles, "Upper-lid");
  if (performance !== undefined) assertPortraitEyePerformance(performance);
  const observed: (at: number) => { attachment: number; } & Record<"margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood", { offset: number; projection: number; }> = createPortraitLidSectionSampler(
    input.sections,
    roles,
    "Upper-lid",
    assertFoldedSection,
  );
  const closed: (at: number) => { attachment: number; } & Record<"margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood", { offset: number; projection: number; }> = createPortraitLidSectionSampler(
    input.closedSections,
    roles,
    "Upper-lid",
  );
  if (
    input.sections.length !== input.closedSections.length ||
    input.sections.some(
      (witness: { at: number; section: IPortraitUpperLidSection; }, i: number): boolean  =>
        witness.at !== input.closedSections![i].at ||
        witness.section.attachment !==
          input.closedSections![i].section.attachment,
    )
  )
    throw new Error(
      "Upper-lid unfolding needs the same witnesses and fixed attachment distances.",
    );
  const closure: number =
    performance === undefined
      ? 0
      : (performance.blink - performance.observedBlink) /
        (1 - performance.observedBlink);
  if (closure === 0) return observed;
  return (at: number): { attachment: number; } & Record<"margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood", { offset: number; projection: number; }>  => {
    const from: { attachment: number; } & Record<"margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood", { offset: number; projection: number; }> = observed(at),
      to: { attachment: number; } & Record<"margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood", { offset: number; projection: number; }> = closed(at);
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
  let previous: number = 0;
  for (const role of roles) {
    const point: IPortraitUpperLidPoint = section[role];
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
  const floor: number =
    Math.min(0, ...roles.map((role: "margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood"): number  => section[role].projection)) - 1;
  // Close below the entire tissue curve. This auxiliary edge is only for the
  // engine's shared metre-space intersection predicate; it is never rendered.
  const polygon: { x: number; y: number; }[] = [
    { x: 0, y: 0 },
    ...roles.map((role: "margin" | "preseptal" | "tarsal" | "creaseInner" | "creaseOuter" | "hood"): { x: number; y: number; }  => ({
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

const roles: readonly ["margin", "tarsal", "creaseInner", "creaseOuter", "hood", "preseptal"] = [
  "margin",
  "tarsal",
  "creaseInner",
  "creaseOuter",
  "hood",
  "preseptal",
] as const;
