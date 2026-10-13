/**
 * One drafted line's relation to the cut plane and the view depth.
 *
 * The role is decided per drawn element from the signed distances of its
 * triangle corners to the cut plane, not per line and not by occlusion:
 *
 * - `cut`: where the cut plane passes through the element.
 * - `projected`: the element's silhouette on the far side of the cut, or the
 *   whole element in an elevation.
 * - `overhead`: an element wholly on the viewer's side of the cut, drawn only
 *   within the view's `overhead` band.
 * - `hidden`: an element wholly beyond the view's `depth`.
 *
 * Lines sort by role in that order.
 *
 * @evidence contracts/common.md#principled-implementation Classifies each drawable by the minimum and maximum signed distance of its corners to the cut plane with a fixed epsilon, the plan convention of cut, beyond and above-cut bands.
 * @evidence contracts/common.md#clear-and-simple-design Four literals map onto the view's cut, `depth` and `overhead` settings, and the pen for each role lives in the view style instead of on the line.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `hidden` means beyond the depth band, not occluded; hidden-line removal does not exist, and the drawing declares that as a gap instead of implying visibility.
 * @evidence contracts/common.md#meaningful-documentation Defines each literal by the geometric band that produces it, states that roles are per element rather than per occlusion, and gives the sort order.
 * @author Samchon
 */
export type AutoMovieDrawingRole = "cut" | "projected" | "overhead" | "hidden";
