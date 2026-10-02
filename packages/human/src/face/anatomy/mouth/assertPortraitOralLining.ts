import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";

/**
 * Admit oral lining depth and the fraction before its posterior taper. These
 * are authoring dimensions, not recovered palate or pharyngeal measurements.
 *
 * @evidence contracts/common.md#principled-implementation The lining's depth rings and single posterior pole are computed from `1.8 * depth` and a cosine taper over `[wall, 1]`, so the admission checks exactly what those formulas need: a finite positive depth (including finiteness of the scaled depth), a wall fraction below one so the taper has a denominator, and chamber values that keep the smooth-step weight defined.
 * @evidence contracts/common.md#clear-and-simple-design One function that refuses before allocation; the constructor and the component both call it instead of repeating the conditions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The checks are the domain of the enclosure formulas and name no subject, fixture or measured answer.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the values are authoring dimensions and not palate or pharyngeal measurements, and each refusal names the quantity and its range.
 * @evidence contracts/modeling.md#spatial-conventions Depth and chamber values are millimetres in the head frame and the wall is a unitless fraction; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function admits values and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel; it validates the numbers that another declaration documents as channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input through which a caller shapes a face; it refuses values of inputs declared elsewhere.
 */
export function assertPortraitOralLining(
  depth: number,
  wall: number,
  chamber?: IPortraitOralChamber,
): void {
  if (!Number.isFinite(1.8 * depth) || depth <= 0)
    throw new Error("Oral lining depth must be finite and positive.");
  if (!Number.isFinite(wall) || wall < 0 || wall > 0.95)
    throw new Error("Oral lining wall fraction must be in [0,0.95].");
  if (
    chamber !== undefined &&
    (![
      chamber.horizontalExpansion,
      chamber.verticalExpansion,
      chamber.transitionDepth,
    ].every(Number.isFinite) ||
      chamber.horizontalExpansion < 0 ||
      chamber.verticalExpansion < 0 ||
      chamber.transitionDepth <= 0)
  )
    throw new Error(
      "Oral chamber needs finite nonnegative expansions and a positive transition depth.",
    );
}
