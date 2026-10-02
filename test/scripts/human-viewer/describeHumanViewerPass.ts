import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * What a display pass can and cannot be read for, answered with every frame so
 * a card or a wire mesh is never mistaken for tissue. Beauty and clay carry
 * directional light and are the passes that judge shape and material. Normal,
 * depth and flat isolate geometry from material and lighting and judge no
 * colour. Wire draws every triangle edge of the selected meshes without
 * hidden-surface removal, so edges of the far side show through the near side:
 * it reads mesh density and topology, never silhouette or surface order, and a
 * whole-figure frame fills in to a solid grey. Outline reads silhouette only.
 *
 * @evidence contracts/common.md#principled-implementation Each statement follows from what the pass draws: lighting, material, depth testing and edge drawing.
 * @evidence contracts/common.md#clear-and-simple-design One table owns the reading limit of every pass for headers and tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document or part is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the single limit that misleads most, the wire pass's see-through edges.
 */
export function describeHumanViewerPass(pass: HumanViewerAddress["pass"]): string {
  switch (pass) {
    case "beauty":
      return "lit product frame: judges shape and material under directional light";
    case "clay":
      return "lit single-material frame: judges shape without material colour";
    case "normal":
      return "surface normals as colour: judges orientation and smoothness, not light or material";
    case "depth":
      return "depth as grey: judges relief order only, low contrast on flat regions";
    case "flat":
      return "unlit material colour: judges material regions, not shape";
    case "wire":
      return "all triangle edges with far-side edges showing through: judges mesh density and topology only, never silhouette or surface order, and a whole figure fills to solid grey";
    case "outline":
      return "silhouette edges only: judges outline, not interior shape";
  }
}
