import { samplePortraitNasalSection } from "../samplePortraitNasalSection";

/**
 * Shared by IPortraitNasalEnvelope, createPortraitNasalEnvelope, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates circumferential tissue width, crest position and inward roll instead of assigning one torus section to every nasal margin.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered unit-perimeter station with metric exterior dimensions and a signed shared-rim tangent angle.
 * @author Samchon
 */
export function cyclic(points: readonly number[][], phase: number): number[] {
  const at = phase * points.length,
    index = Math.floor(at),
    t = at - index;
  const p = (i: number) => points[(i + points.length) % points.length];
  return samplePortraitNasalSection(
    {
      point: p(index),
      derivative: p(index + 1).map((v, axis) => (v - p(index - 1)[axis]) / 2),
    },
    {
      point: p(index + 1),
      derivative: p(index + 2).map((v, axis) => (v - p(index)[axis]) / 2),
    },
    1,
    t,
  ).point;
}
