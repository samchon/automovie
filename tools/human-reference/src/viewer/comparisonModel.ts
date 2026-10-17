import type { IAutoMovieGeometry } from "../../../../packages/interface/src/model/IAutoMovieGeometry.ts";
import type { IAutoMovieModel } from "../../../../packages/interface/src/model/IAutoMovieModel.ts";

/**
 * Binds already produced interface geometry to the matched neutral inspection material.
 *
 * @evidence contracts/common.md#principled-implementation Preserves metre-valued IAutoMovieGeometry and binds one neutral linear-RGB material.
 * @evidence contracts/common.md#clear-and-simple-design A single static part separates display appearance from geometry production.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The wrapper neither generates geometry nor certifies whether its caller used an engine operator.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre units and the wrapper's provenance limit.
 * @evidence contracts/performance.md#efficient-algorithms Creates one part and material in constant work while borrowing the geometry arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Both comparison roles use identical material coefficients without sharing mutable model state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns plain model data and borrowed geometry; buildModel owns later GPU allocation.
 */
export function comparisonModel(
  geometry: IAutoMovieGeometry,
  origin: IAutoMovieModel["origin"],
  id: string,
): IAutoMovieModel {
  return {
    id,
    name: id,
    origin,
    parts: [
      {
        id: "skin",
        name: null,
        geometry,
        material: "neutral",
        attachedBone: null,
        transform: null,
      },
    ],
    skeleton: null,
    body: null,
    materials: [
      {
        id: "neutral",
        name: null,
        baseColor: { r: 0.6, g: 0.6, b: 0.6, a: 1, hex: null },
        metallic: 0,
        roughness: 0.8,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
        normalTexture: null,
        doubleSided: true,
      },
    ],
    asset: null,
  };
}
