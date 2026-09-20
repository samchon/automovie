import { Vector3 } from "@automovie/engine";

/**
 * Shared by IPortraitNasalEnvelopeSection, createPortraitNasalEnvelope, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates circumferential tissue width, crest position and inward roll instead of assigning one torus section to every nasal margin.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered unit-perimeter station with metric exterior dimensions and a signed shared-rim tangent angle.
 * @author Samchon
 */
export function unit(p: readonly number[]): number[] {
  const n = Vector3.normalize(
    Vector3.create(...(p as [number, number, number])),
  );
  if (Vector3.length(n) === 0 || ![n.x, n.y, n.z].every(Number.isFinite))
    throw new Error("A nasal envelope needs nonzero finite surface normals.");
  return [n.x, n.y, n.z];
}
