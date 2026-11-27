import { autoMovieFluidSurfaceNodeName as autoMovieFluidSurfaceNodeNameImplementation } from "./internal/autoMovieFluidSurfaceNodeName";
import { autoMoviePlantingNodeName as autoMoviePlantingNodeNameImplementation } from "./internal/autoMoviePlantingNodeName";
import { autoMovieSoftBodyNodeName as autoMovieSoftBodyNodeNameImplementation } from "./internal/autoMovieSoftBodyNodeName";
import { autoMovieSurfaceGraphicNodeName as autoMovieSurfaceGraphicNodeNameImplementation } from "./internal/autoMovieSurfaceGraphicNodeName";

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
    return autoMovieFluidSurfaceNodeNameImplementation(domain);
  }

  /** Name of the viewer group drawing one planting cluster's batches. */
  export function autoMoviePlantingNodeName(cluster: string): string {
    return autoMoviePlantingNodeNameImplementation(cluster);
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
    return autoMovieSoftBodyNodeNameImplementation(domain);
  }

  /**
   * Name of the viewer object drawing one surface graphic track, which is also
   * its semantic mask id: `surface-graphic:<node>/<surface>`.
   *
   * Mirrors `prepareAutoMovieSurfaceGraphics` in `render`. The engine cannot
   * import the viewer and the mask has to be derivable without a renderer, so the
   * name both sides agree on lives here.
   */
  export function autoMovieSurfaceGraphicNodeName(node: string, surface: string): string {
    return autoMovieSurfaceGraphicNodeNameImplementation(node, surface);
  }
}
