/**
 * One diffusion-guide render pass over the same deterministic frame.
 *
 * An automovie render is not the final image; it is the stable performance a
 * generative video pass paints over. Each pass name selects what the viewer
 * draws for a frame so a diffusion workflow (ControlNet-style conditioning) can
 * follow the structure automovie computed:
 *
 * - `beauty`: the ordinary shaded render (the default preview).
 * - `depth`: depth-to-grayscale on a scene-stable metric range, the depth hint.
 * - `mask`: per-scene-node flat silhouette colors, the segmentation hint.
 * - `normal`: the unlit surface-normal render, the normal-map hint (#1166).
 * - `outline`: real white silhouette edges on black (an inverted-hull contour),
 *   the line/edge hint (#1166); no host post-processing required.
 * - `pose`: the skeleton overlay: bone segments over a flat background, the pose
 *   hint.
 *
 * Closed union so an invalid pass name is structurally impossible at the LLM
 * surface; render's `AUTOMOVIE_GUIDE_PASSES` carries the matching runtime list.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union names what the viewer draws per frame; the viewer's `applyRenderMode` maps each value to one material override, and render tests requested names against `AUTOMOVIE_GUIDE_PASSES` through `isGuidePass`.
 * @evidence contracts/common.md#clear-and-simple-design Values are names only: pass parameters such as the depth normalization range stay in the viewer, and render narrows to structural passes with `Exclude<AutoMovieGuidePass, "beauty">` instead of a second union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runtime lists (`AUTOMOVIE_GUIDE_PASSES`, the set inside `assertSingleGuidePass`) are typed arrays and sets that the compiler does not check for completeness, so a new member compiles without being added to them.
 * @evidence contracts/common.md#meaningful-documentation States each pass's conditioning purpose, that `beauty` is the default preview, that `outline` needs no host post-processing, and where the runtime list lives.
 * @author Samchon
 */
export type AutoMovieGuidePass =
  /** Ordinary shaded render. */
  | "beauty"

  /** Depth-to-grayscale conditioning pass. */
  | "depth"

  /** Per-node flat-color segmentation pass. */
  | "mask"

  /** Unlit surface-normal pass. */
  | "normal"

  /** Silhouette edge pass: white contour lines on black. */
  | "outline"

  /** Skeleton-overlay pose pass. */
  | "pose";
