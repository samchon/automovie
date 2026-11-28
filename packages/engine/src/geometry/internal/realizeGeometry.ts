import type {
  IAutoMovieGeometry,
  IAutoMovieRealizeBicubicAtlas64,
  IAutoMovieRealizeGeometry,
} from "@automovie/interface";

import { realizeBicubicAtlas64 } from "./realizeBicubicAtlas64";
import { tessellateToMesh } from "./tessellateToMesh";

/*
 * Resolve each public geometry recipe through its deterministic engine owner.
 * Mesh input is borrowed unchanged; recipes produce newly owned arrays. Atlas
 * completion and diagnostics describe processing. Display uses the atlas's
 * retained mesh. A complete-processing request refuses an incomplete atlas.
 */
export function realizeGeometry(
  geometry: IAutoMovieGeometry,
  requirement: "complete" | "display" = "display",
): IAutoMovieRealizeGeometry.IResult {
  switch (geometry.type) {
    case "primitive":
      return {
        mesh: tessellateToMesh(geometry.shape),
        complete: true,
        diagnostics: [],
      };
    case "mesh":
      return { mesh: geometry.mesh, complete: true, diagnostics: [] };
    case "bicubic-atlas": {
      const realized: IAutoMovieRealizeBicubicAtlas64.IResult =
        realizeBicubicAtlas64(geometry);
      if (requirement === "complete" && !realized.complete)
        throw new Error(
          `Bicubic atlas processing is incomplete: ${realized.diagnostics.join("; ")}`,
        );
      return realized;
    }
    default:
      throw new Error("Unknown public geometry recipe");
  }
}
