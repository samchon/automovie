import type {
  AutoMovieGuidePass,
  IAutoMovieControlRecord,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { AutoMovieRenderDepthNormalizationRange } from "../../scene/AutoMovieRenderDepthNormalizationRange";
import { AutoMovieRenderEdgeWidth } from "../../scene/AutoMovieRenderEdgeWidth";

/*
 * The pixel convention a control channel was drawn with, as the draw page draws
 * it.
 *
 * The draw page applies every pass through `applyRenderMode` with its defaults,
 * so `depth` normalizes over `AutoMovieRenderDepthNormalizationRange` and `outline` extrudes
 * by `AutoMovieRenderEdgeWidth`. The `mask` pass picks its palette in the page, so its
 * convention comes from the palette the page reported: semantic with the
 * palette's digest and entries, or positional when the scene carries none.
 */
export function controlConvention(
  pass: Exclude<AutoMovieGuidePass, "beauty">,
  semanticMask: IAutoMovieSemanticMask | null,
): IAutoMovieControlRecord.Convention {
  switch (pass) {
    case "depth":
      return {
        pass,
        kind: "linear",
        rangeMetres: AutoMovieRenderDepthNormalizationRange,
      };
    case "mask":
      return semanticMask === null
        ? { pass, kind: "positional" }
        : {
            pass,
            kind: "semantic",
            digest: semanticMask.digest,
            entries: semanticMask.entries,
          };
    case "normal":
      return { pass, kind: "camera" };
    case "outline":
      return { pass, kind: "inverted-hull", edgeWidth: AutoMovieRenderEdgeWidth };
    case "pose":
      return { pass, kind: "bone-segments" };
    case "albedo":
      return { pass, kind: "base-colour" };
    case "graphics":
      return { pass, kind: "straight-alpha" };
  }
}
