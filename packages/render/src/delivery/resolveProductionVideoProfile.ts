import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { AUTOMOVIE_MP4_SRGB_COLOUR } from "../node/AUTOMOVIE_MP4_SRGB_COLOUR";
import { AUTOMOVIE_MP4_UNITY_MATRIX } from "../node/AUTOMOVIE_MP4_UNITY_MATRIX";
import type { IAutoMovieProductionVideoProfile } from "./IAutoMovieProductionVideoProfile";

/**
 * Resolve authored raster and exact clock to the current MP4 picture profile.
 */
export const resolveProductionVideoProfile = (props: {
  width: number;
  height: number;
  frameRate: IAutoMovieProductionFrameRate;
}): IAutoMovieProductionVideoProfile => ({
  width: props.width,
  height: props.height,
  frameRate: props.frameRate,
  brands: { major: "isom", requiredCompatible: ["isom"] },
  trackMatrix: [
    ...AUTOMOVIE_MP4_UNITY_MATRIX,
  ] as IAutoMovieProductionVideoProfile["trackMatrix"],
  pixelAspect: "square",
  color: AUTOMOVIE_MP4_SRGB_COLOUR,
});
