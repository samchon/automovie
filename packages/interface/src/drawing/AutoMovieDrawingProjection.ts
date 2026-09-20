/**
 * What a view does to the design before it draws it.
 *
 * A plan, a reflected ceiling plan, a section and an elevation are not four
 * drawing kinds with four algorithms; they are one orthographic projection with
 * two decisions: where the cut plane is, and which side of it survives. Naming
 * them separately here is what lets a derivation state the drafting convention
 * it is honouring rather than leaving the reader to infer it from a normal.
 *
 * - `plan` looks down. Material above the cut is removed, what the plane passes
 *   through is drawn `cut`, and what lies below is drawn `projected`.
 * - `reflected-ceiling-plan` looks up. Material below the cut is removed and the
 *   ceiling above it is drawn. The page basis is mirrored so a coffer at a
 *   world point lands on the same page point it occupies in the plan, which is
 *   exactly what "reflected" has always meant: the ceiling as it would appear
 *   in a mirror laid on the floor, so the two drawings can be read against each
 *   other.
 * - `section` cuts on a vertical plane and keeps what is beyond it.
 * - `elevation` has no cut at all. Nothing is removed and nothing is `cut`; the
 *   origin only fixes where the page origin sits on the picture plane.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingProjection` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingProjection` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export type AutoMovieDrawingProjection =
  | "plan"
  | "reflected-ceiling-plan"
  | "elevation"
  | "section";
