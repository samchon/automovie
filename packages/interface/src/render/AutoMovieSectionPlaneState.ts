/**
 * How a bounded body stands to a set of section planes, as
 * `classifySectionPlaneBox` reports it for an axis-aligned box.
 *
 * - `kept`: no plane removes any part of the body; a body touching a plane is
 *   kept.
 * - `cut`: some single plane removed the whole body.
 * - `crossed`: at least one plane passes through the body and no one plane
 *   removed it whole. It does not promise a surviving point, because two planes
 *   can between them remove a body that neither removes alone, so do not read
 *   it as partly visible.
 */
export type AutoMovieSectionPlaneState = "kept" | "cut" | "crossed";
