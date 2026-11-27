import { fluidSurfaceNodeName as fluidSurfaceNodeNameImplementation } from "./internal/fluidSurfaceNodeName";
import { plantingNodeName as plantingNodeNameImplementation } from "./internal/plantingNodeName";
import { softBodyNodeName as softBodyNodeNameImplementation } from "./internal/softBodyNodeName";
import { surfaceGraphicNodeName as surfaceGraphicNodeNameImplementation } from "./internal/surfaceGraphicNodeName";

/** Public operations for Auto Movie Engine Render Node. */
export namespace AutoMovieEngineRenderNode {
  /**
   * Name of the viewer mesh drawing one flame cue, which also serves as its
   * semantic mask ID: `flame:<node>/<cue id>`.
   */
  export function autoMovieFlameNodeName(node: string, cue: string): string {
    return `flame:${node}/${cue}`;
  }

  /** Name of the viewer object drawing one fluid domain's free surface. */
  export function autoMovieFluidSurfaceNodeName(domain: string): string {
    return fluidSurfaceNodeNameImplementation(domain);
  }

  /** Name of the viewer group drawing one planting cluster's batches. */
  export function autoMoviePlantingNodeName(cluster: string): string {
    return plantingNodeNameImplementation(cluster);
  }

  /**
   * Name of the viewer object drawing one soft-body panel.
   *
   * Mirrors `buildSoftBodyObject`. The engine cannot import the viewer and the
   * mask has to be derivable without a renderer, so the names both sides agree on
   * live here and are asserted by the test suite, exactly as the standable
   * ground's group name is.
   */
  export function autoMovieSoftBodyNodeName(domain: string): string {
    return softBodyNodeNameImplementation(domain);
  }

  /**
   * Name of the viewer object drawing one surface graphic track, which is also
   * its semantic mask id: `surface-graphic:<node>/<surface>`.
   *
   * Mirrors `prepareSurfaceGraphics` in `render`. The engine cannot
   * import the viewer and the mask has to be derivable without a renderer, so the
   * name both sides agree on lives here.
   */
  export function autoMovieSurfaceGraphicNodeName(node: string, surface: string): string {
    return surfaceGraphicNodeNameImplementation(node, surface);
  }
}
