import type { IAutoMovieTextureReference } from "@automovie/interface";


export const pvTextureBinding: IAutoMovieTextureReference = {
  asset: "canopy-pv-cell", texCoord: 0, coordinateSource: "surface-metres", colorSpace: "srgb",
  sampler: { wrapS: "repeat", wrapT: "repeat", minFilter: "linearMipmapLinear", magFilter: "linear" },
};
