/**
 * How a bounded body stands to a set of section planes.
 *
 * `cut` is a fact: some single plane removed the whole body. `crossed` is only
 * the absence of that fact — no one plane removed it whole — and does NOT
 * promise a surviving point, because two planes can between them remove a body
 * that neither removes alone. Reading `crossed` as "partly visible" is the
 * mistake this union is named to prevent.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Names the three outcomes a declared cut has for a body without overstating a partial result.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the specified `kept`, `cut`, and `crossed` outcome of evaluating a bound against the optional clipping planes.
 */
export type AutoMovieSectionPlaneState = "kept" | "cut" | "crossed";
