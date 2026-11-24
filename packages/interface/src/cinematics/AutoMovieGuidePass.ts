/**
 * One beauty or structural render pass over an engine frame.
 *
 * `beauty` delivers the ordinary shaded film frame. Structural passes support
 * inspection and can also supply external conditioning; each name selects the
 * viewer projection of the current scene:
 *
 * - `beauty`: the ordinary shaded render and the default preview.
 * - `depth`: grays linear in camera-space distance over a scene-stable metric
 *   range rather than the clip planes, with a black background for infinite
 *   distance; the depth hint.
 * - `mask`: flat unlit colours per semantic entity, or per top-level scene child
 *   when the scene carries no semantic palette; the segmentation hint.
 * - `normal`: the unlit surface-normal render; the normal-map hint.
 * - `outline`: white inverted-hull silhouette contours on black, with no host
 *   post-processing; the line hint.
 * - `pose`: meshes hidden and every bone-to-child segment drawn over black; the
 *   pose hint.
 * - `albedo`: every mesh drawn unlit in its material's base colour, the colour
 *   factor times the base-colour texture where the material has one, encoded to
 *   sRGB once, on black, with no light, environment, shadow, fog or tone
 *   mapping; alpha-test cutouts are kept, a surface the beauty pass skips stays
 *   hidden and every other surface is opaque; the material channel. Roughness,
 *   metalness and emission are not produced.
 * - `graphics`: the surface graphics alone, as `beauty` draws them, with every
 *   other mesh writing depth only so whatever stands in front hides them, on a
 *   transparent background whose alpha is the graphics' coverage; the plate a
 *   finishing step composites legible screens and lettering from. Raised
 *   lettering is ordinary geometry and stays out. Unlike the structural passes,
 *   which show the shot a frame shows most of, the plate goes through a
 *   transition as `beauty` does: a dissolve mixes the two shots' plates by
 *   their weights and a fade dips its coverage to 0 at the midpoint, so it
 *   composites over the delivered film.
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
  | "pose"

  /** Unlit material base colour on black. */
  | "albedo"

  /** Surface graphics alone over a transparent background. */
  | "graphics";
