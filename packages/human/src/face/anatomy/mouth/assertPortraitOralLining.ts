import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";

/**
 * Admit oral lining depth and the fraction before its posterior taper. These
 * are authoring dimensions, not recovered palate or pharyngeal measurements.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Keeps the selected cavity's depth and wall shape explicit and finite.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Requires positive representable depth and a wall fraction in [0,0.95].
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
