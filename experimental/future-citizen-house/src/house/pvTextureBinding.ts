import type { IAutoMovieTextureReference } from "@automovie/interface";


/** Repeating metre-scaled binding of the photovoltaic cell texture. */
export const pvTextureBinding: IAutoMovieTextureReference = {
  asset: "canopy-pv-cell", texCoord: 0, coordinateSource: "surface-metres", colorSpace: "srgb",
  sampler: { wrapS: "repeat", wrapT: "repeat", minFilter: "linearMipmapLinear", magFilter: "linear" },
};
