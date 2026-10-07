/**
 * One soft surface a face basis's oral contact holds outside the colliders.
 *
 * A soft vertex's floor is its clearance in the shape-only rest state, or the
 * collider cover where it rested farther out, or its rest depth where the
 * source authored it inside. A vertex pushed past that floor is moved back to
 * it along the nearest feature, and a push beyond `budgetMetres` refuses the
 * document.
 *
 * @evidence contracts/common.md#principled-implementation Each soft vertex keeps its rest floor and a push beyond the budget refuses instead of being clamped.
 * @evidence contracts/common.md#clear-and-simple-design One named record pairs the soft surface with its push budget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The budget is shared basis data, never a per-person tolerance chosen to pass a case.
 * @evidence contracts/common.md#meaningful-documentation States the floor rule, the push direction, the unit and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions The budget is metres in the Y-up head frame.
 * @evidence contracts/modeling.md#shared-boundaries The soft surface is held outside the rigid colliders it meets.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record addresses an existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The budget is a numerical push limit, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds a push, not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactSoftSurface {
  /** ID of the soft surface. */
  surface: string;

  /** Metres a vertex may be pushed back before the document is refused. */
  budgetMetres: number;
}
