import { samplePortraitNasalSection } from "../samplePortraitNasalSection";

/**
 * Sample a closed ring of nasal envelope stations at a phase in `[0, 1)`.
 *
 * The phase selects the segment between two neighbouring stations, wrapping
 * past the end. Each station's derivative is the central difference of its two
 * neighbours (half the span between them), and the segment is sampled by
 * `samplePortraitNasalSection` at its own parameter. Shared by
 * `IPortraitNasalEnvelope` and `createPortraitNasalEnvelope`.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates circumferential tissue width, crest position and inward roll instead of assigning one torus section to every nasal margin.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines an ordered unit-perimeter station with metric exterior dimensions and a signed shared-rim tangent angle.
 * @author Samchon
 */
export function sampleCyclicNasalSection(points: readonly number[][], phase: number): number[] {
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
