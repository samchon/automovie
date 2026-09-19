import { samplePortraitNasalSection } from "./samplePortraitNasalSection";

/**
 * Compose a boundary-jet correction with its unchanged far end. The signed
 * distance follows one shared transverse direction: positive on exterior skin,
 * negative into the vestibule. The requested derivative therefore changes sign
 * when using the inward section's positive local parameter. Both sides reach
 * the same boundary value and physical derivative at distance zero.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Matches exterior and vestibular boundary jets while leaving the far section unchanged.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Changes the transverse derivative sign for inward travel and blends the boundary correction to a zero far-end jet.
 */
export function portraitNasalJetCorrection(
  positionDelta: readonly number[],
  derivativeDelta: readonly number[],
  span: number,
  signedDistance: number,
): number[] {
  if (!Number.isFinite(signedDistance))
    throw new Error("A nasal section distance must be finite.");
  const direction = signedDistance < 0 ? -1 : 1;
  const left = {
    point: positionDelta,
    derivative: derivativeDelta.map((value) => value * direction),
  };
  const right = { point: [0, 0, 0], derivative: [0, 0, 0] };
  return samplePortraitNasalSection(
    left,
    right,
    span,
    Math.min(1, Math.abs(signedDistance) / span),
  ).point;
}
