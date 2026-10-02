import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Refuse crown profiles before they can alter the row's physical clearances.
 *
 * @evidence contracts/common.md#principled-implementation The loft divides by the cervical ratio's complement and raises the edge rise to a fourth power of (1 - v), and it needs the rise below half the height so the cutting edge stays above the cervix; the admission checks exactly those domains for the crown and for each side contour: finite positive dimensions, ratios in (0, 1], crest heights strictly inside (0, 1) and rises in [0, height/2).
 * @evidence contracts/common.md#clear-and-simple-design One function that both the component and the constructor call, so the admission cannot differ between the direct and the native paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The bounds are the loft's domain; no subject, fixture or measured answer appears.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is refused; the two refusal messages name the quantities and ranges.
 * @evidence contracts/modeling.md#spatial-conventions Dimensions are millimetres in the crown's local frame and the ratios are unitless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function admits a profile and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel of its own; it validates the crown members documented on the crown type.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input through which a caller shapes a face; it refuses values of inputs declared on the crown type.
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
