import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieGeometry, IAutoMovieModel } from "@automovie/interface";

/*
 * Wrap an existing geometric solid as one generated scenic model.
 * Parameter id: Instance-scoped model identity.
 * Parameter name: Human-readable element name.
 * Parameter geometry: Model-local geometry in metres.
 * Parameter color: SRGB surface swatch.
 * Returns: A standard model with one owned neutral material and no dynamic
 * body.
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
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor(color),
        metallic: 0,
        roughness: 1,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ],
  };
}
