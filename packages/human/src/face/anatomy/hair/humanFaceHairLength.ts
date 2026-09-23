import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

/**
 * The metre length one root grows to: the layer's six axial lengths combined
 * convexly by the absolute components of the neutral chart direction from
 * the domain origin to the root, times the seeded variation the root's own
 * sample identity fixes. Guides and interpolated strands share it, which is
 * how a strand between two guides keeps its own regional length instead of
 * theirs. A root on the chart origin has no direction and refuses.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Derives every root's length from shared regional fields and its stable sample identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Combines the six positive axial lengths by the absolute chart components and applies the seeded variation.
 */
export function humanFaceHairLength(
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "lengthAxes" | "lengthVariation">,
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
  return (
    regional *
    (1 + layer.lengthVariation * (2 * humanFaceHairSequence(sequence, 7) - 1))
  );
}
