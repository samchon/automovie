import type {
  IAutoMovieProductionVideoProfile,
  IAutoMovieResolveProductionVideoProfileProps,
} from "@automovie/interface";

import { AutoMovieRenderMp4SrgbColour } from "../AutoMovieRenderMp4SrgbColour.js";
import { AutoMovieRenderMp4UnityMatrix } from "../AutoMovieRenderMp4UnityMatrix.js";

/*
 * Resolve an authored raster and exact frame rate to the one H.264-in-MP4
 * picture profile a video deliverable must carry.
 *
 * `width` and `height` are pixels and `frameRate` is the exact rational rate;
 * all three pass through unchecked, so the caller supplies values it already
 * validated. The rest is fixed: major brand `isom` with `isom` required among
 * the compatible brands, the unity track matrix, square pixels, and full-range
 * sRGB color code points. The returned matrix is a fresh copy, so a caller that
 * edits it cannot change the shared constant; the color record is the shared
 * constant itself, whose literal-typed fields admit no other value.
 */
export const resolveProductionVideoProfile: (
  props: IAutoMovieResolveProductionVideoProfileProps,
) => IAutoMovieProductionVideoProfile = (
  props: IAutoMovieResolveProductionVideoProfileProps,
): IAutoMovieProductionVideoProfile => ({
  width: props.width,
  height: props.height,
  frameRate: props.frameRate,
  brands: { major: "isom", requiredCompatible: ["isom"] },
  trackMatrix: [...AutoMovieRenderMp4UnityMatrix],
  pixelAspect: "square",
  color: AutoMovieRenderMp4SrgbColour,
});
