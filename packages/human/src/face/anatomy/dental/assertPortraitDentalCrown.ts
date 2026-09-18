import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Refuse crown profiles before they can alter the row's physical clearances.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Refuses nonphysical enamel profiles before they enter crown construction or arch spacing.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Checks positive crown dimensions and adjacent limits for both proximal crests, cervical ratios and incisal rises.
 */
export function assertPortraitDentalCrown(s: IPortraitDentalCrown): void {
  if (
    ![s.width, s.height, s.depth, s.cervicalWidth, s.edgeRise].every(
      Number.isFinite,
    ) ||
    s.width <= 0 ||
    s.height <= 0 ||
    s.depth <= 0 ||
    s.cervicalWidth <= 0 ||
    s.cervicalWidth > 1 ||
    s.edgeRise < 0 ||
    s.edgeRise >= s.height / 2
  )
    throw new Error(
      "Dental crowns need positive dimensions, bounded cervical width and cutting-edge rise.",
    );
  for (const side of [s.contour?.mesial, s.contour?.distal]) {
    const contact = side?.contactHeight ?? 0.3;
    const cervical = side?.cervicalWidth ?? s.cervicalWidth;
    const rise = side?.incisalRise ?? s.edgeRise;
    if (
      ![contact, cervical, rise].every(Number.isFinite) ||
      contact <= 0 ||
      contact >= 1 ||
      cervical <= 0 ||
      cervical > 1 ||
      rise < 0 ||
      rise >= s.height / 2
    )
      throw new Error(
        "Dental side contours need a bounded contact height, cervical ratio and incisal rise.",
      );
  }
}
