import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieGeometry, IAutoMovieModel } from "@automovie/interface";

/**
 * Wrap an existing geometric solid as one generated scenic model.
 *
 * @param id Instance-scoped model identity.
 * @param name Human-readable element name.
 * @param geometry Model-local geometry in metres.
 * @param color sRGB surface swatch.
 * @returns A standard model with one owned neutral material and no dynamic body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States model-local geometry, scoped identity, the swatch's color space and kinematic ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the canonical sRGB conversion and existing generated model and material records.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure All static masses, slabs and connectors use the same optical assembly without repeating material defaults.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometry is regenerated, scaled or assigned a guessed dynamic mass.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Wraps one geometry in constant time without copying its buffers.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned model borrows the supplied geometry unchanged; equivalent callers may share that immutable input.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one part and one material and retains no handle or cache.
 */
export function buildingModel(
  id: string,
  name: string,
  geometry: IAutoMovieGeometry,
  color: string,
): IAutoMovieModel {
  return {
    id,
    name,
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    parts: [
      {
        id: "solid",
        name: null,
        geometry,
        material: "finish",
        attachedBone: null,
        transform: null,
      },
    ],
    materials: [
      {
        id: "finish",
        name: null,
        baseColor: srgbHexToLinearColor(color),
        metallic: 0,
        roughness: 1,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
  };
}
