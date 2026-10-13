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
 * @author Samchon
 */
export type AutoMovieDrawingRole = "cut" | "projected" | "overhead" | "hidden";
