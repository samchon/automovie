import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

/**
 * The metre length one root grows to: the layer's six axial lengths combined
 * convexly by the absolute components of the neutral chart direction from
 * the domain origin to the root, times the seeded variation the root's own
 * sample identity fixes, and by the layer's front scale in proportion to
 * the root's frontal (+Z) weight. Guides and interpolated strands share it, which is
 * how a strand between two guides keeps its own regional length instead of
 * theirs. A root on the chart origin has no direction and refuses.
 *
 * @evidence contracts/common.md#principled-implementation The absolute
 *   components of the neutral chart direction are normalised by their sum, so
 *   they are nonnegative weights that sum to one, and pick the positive or
 *   negative axial length by the component's sign; the regional length is their
 *   convex combination and so lies between the smallest and largest authored
 *   axis. The frontal factor and the seeded variation multiply it, and the
 *   variation factor 1 + v(2u - 1) stays positive for v below one. A root on the
 *   chart origin has no direction and refuses.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the
 *   regional length, shared by guides and interpolated strands so a strand
 *   between two guides keeps its own length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style; the length is a function of the axes, the chart
 *   position and the sample identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the blend, the front factor, the shared use and the refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Lengths and the chart
 *   direction are metres in the neutral head frame, axes ordered [+X, -X, +Y,
 *   -Y, +Z, -Z]; the weights and factors are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The six lengths are
 *   an authored regional field; the interface states they are not measured
 *   anatomical landmarks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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
  const radial = Vector3.subtract(reference, origin);
  const axes = [radial.x, radial.y, radial.z];
  const sum = axes.reduce((total, value) => total + Math.abs(value), 0);
  if (!Number.isFinite(sum) || sum === 0)
    throw new Error("Hair length needs a nonsingular neutral chart direction.");
  const regional = axes.reduce(
    (total, value, axis) =>
      total +
      (Math.abs(value) / sum) *
        layer.lengthAxes[2 * axis + (value < 0 ? 1 : 0)],
    0,
  );
  const front = Math.max(0, axes[2]) / sum;
  return (
    regional *
    (1 + ((layer.frontScale ?? 1) - 1) * front) *
    (1 + layer.lengthVariation * (2 * humanFaceHairSequence(sequence, 7) - 1))
  );
}
