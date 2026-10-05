import { Vector3 } from "@automovie/engine";

import { resolveHumanFaceApertureUp } from "../../basis/resolveHumanFaceApertureUp";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";

/**
 * Wrap one build's final posed positions as the context face measurements
 * read.
 *
 * Positions are those the build emits, after articulation, closure and
 * contact; each coordinate a reader sees is rounded to Float32, the precision
 * of the static asset. An unknown surface or an out-of-range vertex refuses by
 * name. The opening direction is the contact frame's, or null when the basis
 * declares no articulation.
 *
 * @evidence contracts/common.md#principled-implementation Readers see exactly the emitted final positions at asset precision, so a reading is what the asset carries.
 * @evidence contracts/common.md#clear-and-simple-design One adapter from the build's posed map to the reader context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown surfaces and vertices refuse instead of reading zeros.
 * @evidence contracts/common.md#meaningful-documentation States the stage, precision, refusals and the null direction.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the Y-up basis head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The context names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The context moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The context emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The context builds no boundary.
 * @evidence contracts/modeling.md#rendered-observation The context reads the surface the editor displays and exports.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The context carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The context bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The context is not an input.
 * @author Samchon
 */
export function createHumanFaceMeasurementContext(
  basis: IAutoMovieHumanFaceBasis,
  posed: ReadonlyMap<string, readonly number[]>,
): IHumanFaceMeasurementContext {
  const positions = (surface: string): readonly number[] => {
    const found = posed.get(surface);
    if (found === undefined)
      throw new Error("A face measurement names an absent surface: " + surface + ".");
    return found;
  };
  return {
    basis,
    point: (surface, vertex) => {
      const values = positions(surface);
      if (!Number.isSafeInteger(vertex) || vertex < 0 || 3 * vertex + 2 >= values.length)
        throw new Error(`A face measurement names an absent vertex ${vertex} of ${surface}.`);
      return Vector3.create(
        Math.fround(values[3 * vertex]),
        Math.fround(values[3 * vertex + 1]),
        Math.fround(values[3 * vertex + 2]),
      );
    },
    surface: (surface) => ({
      positions: positions(surface).map(Math.fround),
      indices: basis.surfaces.find((candidate) => candidate.id === surface)!.indices,
    }),
    apertureUp:
      basis.articulation === undefined
        ? null
        : resolveHumanFaceApertureUp(basis.articulation.jaw.axis),
  };
}
