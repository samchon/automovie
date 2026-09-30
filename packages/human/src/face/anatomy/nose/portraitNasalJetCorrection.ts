import { samplePortraitNasalSection } from "./samplePortraitNasalSection";

/**
 * Compose a boundary-jet correction with its unchanged far end. The signed
 * distance follows one shared transverse direction: positive on exterior skin,
 * negative into the vestibule. The requested derivative therefore changes sign
 * when using the inward section's positive local parameter. Both sides reach
 * the same boundary value and physical derivative at distance zero.
 *
 * @evidence contracts/common.md#principled-implementation A boundary correction that is the given position and derivative deltas at distance zero and zero (with zero slope) at the far end is the Hermite segment sampled by samplePortraitNasalSection; the sign flip of the derivative for negative distances keeps one physical derivative across the boundary. Distances past the span clamp to the unchanged far end.
 * @evidence contracts/common.md#clear-and-simple-design One composition of the shared Hermite sampler with an unchanged far end.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject; the correction depends on the deltas, span and signed distance only.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sign convention, both sides' shared boundary value and derivative, and the finite-distance refusal.
 * @evidence contracts/modeling.md#spatial-conventions Deltas, span and distance are in millimetres in one frame; the sign of the distance encodes the exterior (positive) and vestibule (negative) sides.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal jet owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
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
