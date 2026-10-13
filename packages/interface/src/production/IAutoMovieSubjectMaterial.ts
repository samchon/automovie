/**
 * One compiled material identity exposed by a subject description.
 *
 * @evidence contracts/common.md#principled-implementation Material projection copies model-declared id and name; part subjects select their cited material while whole-model subjects list their declared material population in code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design Identity and optional human name suffice for structural inspection, leaving full shading channels in the compiled material record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolved or uncited part material is omitted rather than fabricated, and a whole-model declaration list does not claim every declared material is visibly used by a part.
 * @evidence contracts/common.md#meaningful-documentation Defines model-scoped material id and nullable compiled name, with actual selection scope owned by the subject description.
 * @author Samchon
 */
export interface IAutoMovieSubjectMaterial {
  /** Stable material id inside its model. */
  id: string;

  /** Human-readable compiled material name, or null when unnamed. */
  name: string | null;
}
