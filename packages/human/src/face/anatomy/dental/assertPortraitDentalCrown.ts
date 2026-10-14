import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Refuse crown profiles before they can alter the row's physical clearances.
 *
 * @evidence contracts/common.md#principled-implementation Positive width/height/depth and bounded cervical ratios/contact heights/incisal rises establish the crown loft's finite geometric premises.
 * @evidence contracts/common.md#clear-and-simple-design The common crown dimensions are checked first and the two optional side contours use their resolved fallback values in the same guard.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid contour values refuse before they can change row separation; the guard does not clip a profile or claim observed tooth anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose locates admission before physical clearance effects and the public crown/contour types document each unit and ratio.
 * @evidence contracts/performance.md#efficient-algorithms Five core scalar checks and two contour records require constant time/space independent of any crown mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work Standalone and row preparation reuse this same admission instead of assigning different allowable crown dimensions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input records are read only and no mesh buffers, cache or resource are allocated or retained.
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
    const contact: number = side?.contactHeight ?? 0.3;
    const cervical: number = side?.cervicalWidth ?? s.cervicalWidth;
    const rise: number = side?.incisalRise ?? s.edgeRise;
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
