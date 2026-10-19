import type { IAutoMovieGeometry, IAutoMovieMesh } from "@automovie/interface";

import { realizeAutoMovieBicubicAtlas64 } from "./realizeAutoMovieBicubicAtlas64";
import { tessellateToMesh } from "./tessellateToMesh";

/**
 * Resolve each public geometry recipe through its deterministic engine owner.
 * Mesh input is borrowed unchanged; recipes produce newly owned arrays.
 * Atlas completion and diagnostics describe processing, not shape quality.
 * Retained finite geometry is returned by default, including for indirect
 * framing and drawing callers. Only an explicit complete-processing query
 * refuses partial output; display never opts into that gate.
 *
 * @evidence contracts/common.md#principled-implementation The closed geometry discriminator selects existing primitive tessellation, explicit mesh identity, or complete Bernstein atlas realization.
 * @evidence contracts/common.md#clear-and-simple-design Drawing, measurement and display share one realization dispatch instead of independently approximating recipes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown geometry has no fallback; atlas resource gaps remain explicit and do not block finite display or indirect framing by default.
 * @evidence contracts/common.md#meaningful-documentation States borrowed versus generated ownership and the limited meaning of processing completion.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch is constant work; each selected producer documents its own geometry-dependent cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One call invokes its selected producer once; request owners decide reuse across unchanged geometry definitions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This owner stores no global result; borrowed mesh lifetime stays with the caller and newly generated arrays transfer to it.
 */
export function realizeAutoMovieGeometry(
  geometry: IAutoMovieGeometry,
  requirement: "complete" | "display" = "display",
): { mesh: IAutoMovieMesh; complete: boolean; diagnostics: string[] } {
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
      const realized: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
        realizeAutoMovieBicubicAtlas64(geometry);
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
