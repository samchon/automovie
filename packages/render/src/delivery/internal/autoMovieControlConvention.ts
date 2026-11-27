import type {
  AutoMovieGuidePass,
  IAutoMovieControlRecord,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { DEPTH_NORMALIZATION_RANGE } from "../../scene/DEPTH_NORMALIZATION_RANGE.js";
import { EDGE_WIDTH } from "../../scene/EDGE_WIDTH.js";

/**
 * The pixel convention a control channel was drawn with, as the draw page draws
 * it.
 *
 * The draw page applies every pass through `applyRenderMode` with its defaults,
 * so `depth` normalizes over `DEPTH_NORMALIZATION_RANGE` and `outline` extrudes
 * by `EDGE_WIDTH`. The `mask` pass picks its palette in the page, so its
 * convention comes from the palette the page reported: semantic with the
 * palette's digest and entries, or positional when the scene carries none.
 */
export function autoMovieControlConvention(
  pass: Exclude<AutoMovieGuidePass, "beauty">,
  semanticMask: IAutoMovieSemanticMask | null,
): IAutoMovieControlRecord.Convention {
  switch (pass) {
    case "depth":
      return {
        pass,
        kind: "linear",
        rangeMetres: DEPTH_NORMALIZATION_RANGE,
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
      return { pass, kind: "inverted-hull", edgeWidth: EDGE_WIDTH };
    case "pose":
      return { pass, kind: "bone-segments" };
    case "albedo":
      return { pass, kind: "base-colour" };
    case "graphics":
      return { pass, kind: "straight-alpha" };
  }
}
