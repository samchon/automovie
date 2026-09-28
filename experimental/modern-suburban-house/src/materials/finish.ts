/**
 * Shared data shape for the material owners. A finish names the host
 * surface partitions, its physical response, and the metric tile consumed by
 * the viewer. Geometry and UV axes stay with each model or space host.
 * Changing a finish invalidates material captures of every named host.
 */
import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

/** One already-coloured sRGB tile; the renderer uses a white tint for it. */
export interface HouseTexture {
  readonly file: string;
  readonly metres: readonly [number, number];
  readonly projection: "wall" | "roof" | "ground" | "local";
}

/** A model id and its face ids; trailing punctuation identifies a model family. */
export interface ModelFaceBinding {
  readonly model: string;
  readonly faces: readonly string[];
}

/** Material and its exact host-face vocabulary from the material design. */
export interface HouseFinish {
  readonly material: IAutoMovieMaterial;
  readonly faces: readonly string[];
  readonly modelBindings?: readonly ModelFaceBinding[];
  readonly texture?: HouseTexture;
}

/** Convert the authored sRGB swatch once to scene-linear PBR values. */
export const houseMaterial = (
  id: string,
  hex: string,
  roughness: number,
  optics: Partial<
    Pick<
      IAutoMovieMaterial,
      "metallic" | "transmission" | "ior" | "thickness" | "doubleSided"
    >
  > = {},
): IAutoMovieMaterial => ({
  id,
  name: id.replaceAll("-", " "),
  baseColor: srgbHexToLinearColor(hex),
  metallic: 0,
  roughness,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
  ...optics,
});
