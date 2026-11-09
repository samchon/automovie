/**
 * How a bounded body stands to a set of section planes, as
 * `classifyAutoMovieSectionPlaneBox` reports it for an axis-aligned box.
 *
 * - `kept`: no plane removes any part of the body; a body touching a plane is
 *   kept.
 * - `cut`: some single plane removed the whole body.
 * - `crossed`: at least one plane passes through the body and no one plane
 *   removed it whole. It does not promise a surviving point, because two
 *   planes can between them remove a body that neither removes alone, so do
 *   not read it as partly visible.
 *
 * @evidence contracts/development/design.md#principled-representation Three states derived per plane from the signed distance of the box's two extreme corners, the exact extremes of a linear function over a box: one plane with both extremes on the removed side gives `cut`, all planes with the removed-side extreme at or below zero give `kept`, and anything else gives `crossed`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union of the three facts the classifier can establish without clipping polytopes, rather than a boolean visibility that would need the multi-plane intersection it does not compute.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `crossed` is not upgraded to "visible" or downgraded to "cut" by a heuristic; the multi-plane gap is stated in the state's meaning instead of being guessed.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the condition for each state, that touching is kept, and that `crossed` does not guarantee a surviving point and why.
 */
export type AutoMovieSectionPlaneState = "kept" | "cut" | "crossed";
