import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";

/**
 * Admit oral lining depth and the fraction before its posterior taper. These are authoring dimensions, not recovered palate or pharyngeal measurements.
 *
 * @evidence contracts/common.md#principled-implementation Finite positive depth and wall/chamber ranges are admitted before lining allocation.
 * @evidence contracts/common.md#clear-and-simple-design Component and standalone native preparation share one construction-dimension boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dimensions are authoring values, not recovered palate/pharyngeal measurements; no invalid value is clamped.
 * @evidence contracts/common.md#meaningful-documentation Depth must also keep its 1.8-times posterior reach finite, and optional chamber expansions are nonnegative.
 * @evidence contracts/performance.md#efficient-algorithms A fixed set of scalar checks takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both direct and component paths reuse this validator to keep omission and chamber policy aligned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No lining buffer is allocated and no borrowed chamber record is retained.
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
