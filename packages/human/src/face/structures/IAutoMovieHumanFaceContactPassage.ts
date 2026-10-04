/**
 * The tongue passage a face basis's oral contact evaluates.
 *
 * A tongue past the incisal plane must be thinner, over the slab of half-width
 * `slabMetres` about that plane, than both the interincisal and interlabial
 * apertures, because a constant-volume muscular hydrostat cannot be pressed
 * through closed teeth or sealed lips.
 *
 * @evidence contracts/common.md#principled-implementation The passage compares measured tongue thickness with both apertures on the evaluated document.
 * @evidence contracts/common.md#clear-and-simple-design One named record holds the tongue surface, its protrusion channel and the slab half-width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The slab is shared basis data, never a per-person tolerance chosen to pass a case.
 * @evidence contracts/common.md#meaningful-documentation States the measured slab, its unit and the refusal condition.
 * @evidence contracts/modeling.md#spatial-conventions The slab half-width is metres about the incisal plane in the Y-up head frame.
 * @evidence contracts/modeling.md#parameter-channels The protrusion channel is an existing named channel the passage evaluates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record addresses an existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated form.
 * @evidence contracts/anatomy.md#anatomical-source The tongue is a constant-volume muscular hydrostat that cannot pass closed teeth or sealed lips.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value; the passage evaluator refuses by name.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactPassage {
  /** ID of the tongue surface. */
  surface: string;

  /** Tongue protrusion channel. */
  channel: string;

  /** Slab half-width about the incisal plane, in metres. */
  slabMetres: number;
}
