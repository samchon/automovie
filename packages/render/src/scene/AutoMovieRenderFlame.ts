import { type IAutoMovieFlamesObject } from "./IAutoMovieFlamesObject.js";
import { type IPrepareAutoMovieFlamesProps } from "./IPrepareAutoMovieFlamesProps.js";
import { prepareAutoMovieFlames as prepareAutoMovieFlamesImplementation } from "./flame/internal/prepareAutoMovieFlames.js";

/** Public operations for Auto Movie Render Flame. */
export namespace AutoMovieRenderFlame {
  /**
   * Build a shot's flames once and mount each on its prop.
   *
   * Every cue becomes one mesh named `flame:<node>/<cue id>`, parented to the
   * node's model object at the emitter affordance's frame, so it follows the
   * prop's placement, object motion and carriage. It draws with
   * `createAutoMovieFlameMaterial`, casts no shadow so it never occludes its own
   * light, and takes render order −1, below the prop's parts, so a lantern's
   * blended globe always draws over the flame inside it.
   *
   * Its luminance comes from its light. For a cue bound to a practical light, the
   * light clip whose id is the binding id names the staged light by its intensity
   * track's pointer; the flame's colour is that light's colour and its luminance
   * `I_on / Ā`, the light's on-state intensity over the mean silhouette area of
   * `compileAutoMovieFlameFlicker`, so the light's mean intensity is the flame's
   * mean luminance times its mean area. An unbound cue takes its `emission`. An
   * ember's luminance also follows its glow factor.
   *
   * `apply` re-evaluates each flame's shape with `sampleAutoMovieFlame` at the
   * exact time, rewriting the mesh's positions and normals in place, and shows a
   * flame only inside its `on` interval. A node without a mounted object, a
   * missing emitter or an unresolvable bound light throws, after releasing what
   * was made.
   */
  export function prepare(props: IPrepareAutoMovieFlamesProps): IAutoMovieFlamesObject {
    return prepareAutoMovieFlamesImplementation(props);
  }
}
