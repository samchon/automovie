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
 *   when its corner closest to the cut lies within the view's `overhead` band.
 * - `hidden`: an element wholly beyond the view's `depth`.
 *
 * An element crossing the cut contributes both `cut` and `projected` lines.
 * Lines sort by role in the order listed.
 *
 * @evidence contracts/common.md#principled-implementation `deriveAutoMovieDrawing` takes the minimum and maximum corner distance of each element: a minimum above `AUTOMOVIE_DRAWING_EPSILON` with a cut means overhead, a maximum below `-depth` means hidden, and otherwise the cut edges and the clipped silhouette are drafted; occlusion is never computed, which the `hidden-line-removal` gap declares.
 * @evidence contracts/common.md#clear-and-simple-design Four roles are the line types a drafting convention distinguishes, and each maps to one pen in the view's style, so classification and styling stay separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The classification is drafting semantics and says so; it does not pretend to visibility, and no element kind receives a different rule.
 * @evidence contracts/common.md#meaningful-documentation States the per-element basis of the decision, the test behind each role, that an element can yield two roles, and the sort order.
 */
export type AutoMovieDrawingRole = "cut" | "projected" | "overhead" | "hidden";
