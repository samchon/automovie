/**
 * What a view does to the design before it draws it.
 *
 * A plan, a reflected ceiling plan, a section and an elevation are one
 * orthographic projection with two decisions: whether there is a cut plane,
 * and whether the page basis is mirrored. Naming them lets a view state the
 * drafting convention it honours rather than leaving the reader to infer it
 * from a direction.
 *
 * - `plan` looks down. Material wholly above the cut is removed except within
 *   the view's `overhead` band, what the plane passes through is drawn `cut`,
 *   and what lies below is drawn `projected`.
 * - `reflected-ceiling-plan` looks up and cuts the same way, and its page
 *   basis is mirrored so a coffer at a world point lands on the page point it
 *   occupies in the plan: the ceiling as seen in a mirror laid on the floor.
 * - `section` cuts on a plane across the view direction and keeps what is
 *   beyond it.
 * - `elevation` has no cut. Nothing is removed and nothing is drawn `cut`; the
 *   origin fixes the page origin and the plane the view's `depth` is measured
 *   from.
 *
 * The literal states intent only: the view's `direction` and `origin` place the
 * plane, and nothing checks that a `plan` looks down or that a `section` plane
 * is vertical.
 *
 * @evidence contracts/common.md#principled-implementation Every projection shares `autoMovieDrawingFrame` and the signed-distance classification; `autoMovieDrawingHasCut` turns the cut off only for `elevation`, and only `reflected-ceiling-plan` negates the page right axis, which is the whole of the mirror.
 * @evidence contracts/common.md#clear-and-simple-design Four literals select two booleans inside one derivation instead of four drafting algorithms, so every view uses the same clipping, silhouette and rounding code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Direction and plane come only from the view's vectors; the literal never adjusts them, and an inconsistent pairing such as a `plan` looking sideways is drawn as stated rather than corrected.
 * @evidence contracts/common.md#meaningful-documentation States what each literal removes, cuts and mirrors, how `overhead` and `depth` apply, and that the literal is not checked against the direction.
 * @author Samchon
 */
export type AutoMovieDrawingProjection =
  | "plan"
  | "reflected-ceiling-plan"
  | "elevation"
  | "section";
