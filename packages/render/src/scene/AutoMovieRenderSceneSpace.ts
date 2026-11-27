import type { IAutoMovieSpace } from "@automovie/interface";
import type * as THREE from "three";

import { buildSpaceObject as buildSpaceObjectImplementation } from "./internal/buildSpaceObject.js";

/** Public operations for structural scene space geometry. */
export namespace AutoMovieRenderSceneSpace {
  /**
   * Build the structural ground of a space as one `Mesh` per standable surface,
   * grouped under `SPACE_GROUP_NAME`. Opaque authored surface colors are used
   * for beauty rendering; uncolored supports write neither color nor depth.
   * The meshes remain ordinary structural geometry for guide passes.
   *
   * Degenerate footprints contribute no mesh. Heightfield triangles use the
   * grounding height at their vertices; within a twisted bilinear cell they
   * approximate, rather than reproduce, the interior height rule.
   */
  export function buildObject(space: IAutoMovieSpace): THREE.Group {
    return buildSpaceObjectImplementation(space);
  }
}