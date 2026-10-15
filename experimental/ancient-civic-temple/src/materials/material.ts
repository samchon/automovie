import type { IAutoMovieMaterial } from "@automovie/interface";
import { Finish } from "./Finish";
import { templeMaterialPalette } from "./templeMaterialPalette";

const linear = (channel: number): number => {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};
export const material = (finish: Finish): IAutoMovieMaterial => {
  const { color, roughness, metallic, image, scale } = templeMaterialPalette[finish];
  return {
    id: `temple.${finish}`,
    name: finish,
    baseColor: {
      r: linear((color >> 16) & 255),
      g: linear((color >> 8) & 255),
      b: linear(color & 255),
      a: 1,
      hex: null,
    },
    metallic,
    roughness,
    emissive: null,
    opacity: 1,
    baseColorTexture: image === null
      ? null
      : {
        asset: `textures/${image}.png`,
        texCoord: 0,
        coordinateSource: "surface-metres",
        colorSpace: "srgb",
        transform: {
          offset: { x: 0, y: 0 },
          scale: { x: 1 / scale, y: 1 / scale },
          rotationDeg: 0,
        },
        sampler: {
          wrapS: "repeat",
          wrapT: "repeat",
          minFilter: "linearMipmapLinear",
          magFilter: "linear",
        },
      },
  };
};
