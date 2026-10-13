/**
 * One diffusion-guide render pass over the same deterministic frame.
 *
 * An automovie render is the stable performance a generative video pass paints
 * over, not the final image. Each pass name selects what the viewer draws for
 * a frame, so a diffusion workflow with ControlNet-style conditioning can
 * follow the structure automovie computed:
 *
 * - `beauty`: the ordinary shaded render and the default preview.
 * - `depth`: grays linear in camera-space distance over a scene-stable metric
 *   range rather than the clip planes, with a black background for infinite
 *   distance; the depth hint.
 * - `mask`: flat unlit colours per semantic entity, or per top-level scene
 *   child when the scene carries no semantic palette; the segmentation hint.
 * - `normal`: the unlit surface-normal render; the normal-map hint.
 * - `outline`: white inverted-hull silhouette contours on black, with no host
 *   post-processing; the line hint.
 * - `pose`: meshes hidden and every bone-to-child segment drawn over black;
 *   the pose hint.
 *
 * The closed union makes an unknown pass name a type error at the authoring
 * surface; render's `AUTOMOVIE_GUIDE_PASSES` carries the matching runtime list
 * for untyped input.
 *
 * @evidence contracts/common.md#principled-implementation Models the pass vocabulary as a closed string union mirrored by one runtime list, `AUTOMOVIE_GUIDE_PASSES`, and `applyRenderMode` maps each value to one material override that is reversed after the snapshot, so every pass renders the same deterministic frame.
 * @evidence contracts/common.md#clear-and-simple-design A bare literal union with one member per pass is the whole vocabulary; how each pass is drawn belongs to the viewer and how its frames are named belongs to render, so the type carries only identity and meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union is the only structural constraint, with no wrapper alias or validator tag, and the runtime list lives in render because this package is pure types.
 * @evidence contracts/common.md#meaningful-documentation States what every pass draws and which conditioning hint it serves, the depth normalization and mask palette fallback, and where the runtime list for untyped input lives.
 * @author Samchon
 */
export type AutoMovieGuidePass =
  /** Ordinary shaded render. */
  | "beauty"

  /** Metric depth rendered as linear gray. */
  | "depth"

  /** Flat-colour segmentation by semantic entity. */
  | "mask"

  /** Unlit surface-normal render. */
  | "normal"

  /** White silhouette contours on black. */
  | "outline"

  /** Bone segments over black with meshes hidden. */
  | "pose";
