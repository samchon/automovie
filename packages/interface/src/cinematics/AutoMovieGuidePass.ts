/**
 * One beauty or structural render pass over an engine frame.
 *
 * `beauty` delivers the ordinary shaded film frame. Structural passes support inspection and can also supply external conditioning; each name selects the viewer projection of the current scene:
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
