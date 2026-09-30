/**
 * What the review viewport draws the figure as.
 *
 * Each pass answers one question about the shape and none answers about
 * material or light:
 *
 * - `beauty` draws the authored materials and lights, the product frame.
 * - `clay` draws one grey material under the same lights, so shape reads
 *   without colour.
 * - `normal` colours each pixel by its surface normal in view space: it shows
 *   creases, folds and normal discontinuities, and proves nothing about
 *   albedo, roughness or lighting.
 * - `depth` draws distance from the camera as grey, nearer lighter, spread
 *   linearly over the subject's own depth range (the camera's distance to the
 *   subject's centre plus and minus its bounding radius): it shows layering
 *   and how far one part stands in front of another, and its grey scale
 *   follows the camera, so two depth frames compare only at the same camera
 *   and subject.
 * - `flat` draws each triangle with its own face normal under the same
 *   lights: it shows the tessellation and faceted shading that smooth normals
 *   hide.
 * - `wire` draws the triangle edges: it shows mesh density and topology and
 *   nothing of the lit surface.
 * - `outline` draws a white surface with a dark rim two screen pixels wide
 *   where the silhouette or a self-occluding fold ends: it shows the outer
 *   contour and occlusion boundaries at the current camera, and nothing about
 *   surface shape inside a flat region.
 */
export const HUMAN_OBSERVATION_PASSES = [
  "beauty",
  "clay",
  "normal",
  "depth",
  "flat",
  "wire",
  "outline",
] as const;

/** One of `HUMAN_OBSERVATION_PASSES`. */
export type HumanObservationPass = (typeof HUMAN_OBSERVATION_PASSES)[number];
