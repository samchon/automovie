import { Vector3 } from "@automovie/engine";

/**
 * A nasal surface normal as a unit vector, refusing a zero or non-finite one.
 * Used by `createPortraitNasalEnvelope` on every section normal it receives.
 *
 * @evidence contracts/common.md#principled-implementation Dividing a vector by its length yields the unit direction of the same line; a zero or non-finite input has no direction, so the function refuses instead of returning a guess.
 * @evidence contracts/common.md#clear-and-simple-design One normalisation with one refusal, delegated to the engine's Vector3.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fallback normal is invented for a degenerate input; the refusal is the contract.
 * @evidence contracts/common.md#meaningful-documentation The comment states the refusal and the consumer; the thrown message names the failing input.
 * @evidence contracts/modeling.md#spatial-conventions The input and output share the caller's frame; only length is removed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal envelope owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives; it returns one value per call.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a human form; it is arithmetic on values the owner already named.
 */
export function unitNasalNormal(p: readonly number[]): number[] {
  const n = Vector3.normalize(
    Vector3.create(...(p as [number, number, number])),
  );
  if (Vector3.length(n) === 0 || ![n.x, n.y, n.z].every(Number.isFinite))
    throw new Error("A nasal envelope needs nonzero finite surface normals.");
  return [n.x, n.y, n.z];
}
