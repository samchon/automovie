import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

/**
 * The metre length one root grows to: the layer's six axial lengths combined convexly by the absolute components of the neutral chart direction from the domain origin to the root, times the seeded variation the root's own sample identity fixes, and by the layer's front scale in proportion to the root's frontal (+Z) weight. Guides and interpolated strands share it, which is how a strand between two guides keeps its own regional length instead of theirs. A root on the chart origin has no direction and refuses.
 *
 * @evidence contracts/common.md#principled-implementation Absolute neutral chart components blend six regional lengths, then frontal scale and retained sequence variation apply.
 * @evidence contracts/common.md#clear-and-simple-design Guides and interpolated strands share the same own-root regional target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A chart-origin root refuses instead of assigning an arbitrary direction or borrowing guide length.
 * @evidence contracts/common.md#meaningful-documentation The output is metres, with variation tied to root sequence rather than mutable randomness.
 * @evidence contracts/performance.md#efficient-algorithms Three-axis reductions and a radical inverse take constant-axis work plus logarithmic sequence digits.
 * @evidence contracts/performance.md#reuse-equivalent-work The common sequence and length owner keep hierarchy and direct integration semantics aligned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar target escapes; layer fields and reference vectors are unchanged.
 */
export function humanFaceHairLength(
  layer: Pick<
    IAutoMovieHumanFaceHair.Layer,
    "lengthAxes" | "lengthVariation" | "frontScale"
  >,
  origin: IAutoMovieVector3,
  reference: IAutoMovieVector3,
  sequence: number,
): number {
  const radial: IAutoMovieVector3 = Vector3.subtract(reference, origin);
  const axes: number[] = [radial.x, radial.y, radial.z];
  const sum: number = axes.reduce(
    (total: number, value: number): number => total + Math.abs(value),
    0,
  );
  if (!Number.isFinite(sum) || sum === 0)
    throw new Error("Hair length needs a nonsingular neutral chart direction.");
  const regional: number = axes.reduce(
    (total: number, value: number, axis: number): number =>
      total +
      (Math.abs(value) / sum) *
        layer.lengthAxes[2 * axis + (value < 0 ? 1 : 0)],
    0,
  );
  const front: number = Math.max(0, axes[2]) / sum;
  return (
    regional *
    (1 + ((layer.frontScale ?? 1) - 1) * front) *
    (1 + layer.lengthVariation * (2 * humanFaceHairSequence(sequence, 7) - 1))
  );
}
