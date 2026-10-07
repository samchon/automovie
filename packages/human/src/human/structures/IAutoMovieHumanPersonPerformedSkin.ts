/**
 * The two performed halves of a person's skin in the common body frame: the
 * face skin's flat positions, the body skin's flat positions after the cut,
 * and the body triangle indices retained by that cut. Positions are metres,
 * Y up, +Z forward.
 *
 * @evidence contracts/common.md#principled-implementation Performed shading is evaluated from exactly the final face and cut body positions and the cut's retained body cells.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positions are the final performed skin owner's output; nothing neutral substitutes for them.
 * @evidence contracts/common.md#meaningful-documentation States each member, its units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The halves are existing skins; this carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier holds evaluated positions and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared Y-up, +Z-forward performed body frame.
 * @evidence contracts/modeling.md#shared-boundaries Face and body halves are read together because they meet at one shared source boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed from these positions.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical geometry, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonPerformedSkin {
  /** Face skin flat positions, metres. */
  face: readonly number[];

  /** Cut body skin flat positions, metres. */
  body: readonly number[];

  /** Body triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];
}
