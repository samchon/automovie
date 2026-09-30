/**
 * Optional one-body pretarsal roll. These values shape visible surface
 * fullness in the lower-lid construction; they are not a claim about muscle
 * thickness or a detached tissue mesh.
 *
 * @evidence contracts/common.md#principled-implementation Five lengths describe one pretarsal roll: where its crest lies below the margin, how high it is, how far along the lid it keeps full relief (two lengths) and the crest-to-shoulder distance, with optional seven weights to modulate the relief medially to laterally; the lower-lid construction reads exactly these.
 * @evidence contracts/common.md#clear-and-simple-design A flat record consumed by one function, the lid-row calculation. It does have two fields, `width` and `reach`, that act on the same effect, and the record says how they combine instead of hiding it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit and what it changes, including the two longitudinal lengths and how their envelopes combine.
 * @evidence contracts/modeling.md#spatial-conventions Every field is a millimetre length in the lid's section and longitudinal frame, as the field documentation states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes one roll on the lower lid and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
 */
export interface IPortraitAegyoSalShape {
  /** Distance from the lower-lid margin to the roll crest, in millimetres. */
  offset: number;

  /** Positive anterior relief at the crest, in millimetres. */
  projection: number;

  /**
   * Length along the lower lid, in millimetres and centred on the aperture,
   * over which the roll keeps its full relief. Relief fades smoothly to zero
   * at both canthi beyond it. The section's own transverse extent is `height`.
   * A length at or above the aperture width never fades.
   */
  width: number;

  /** Crest-to-shoulder distance across the lid, in millimetres. */
  height: number;

  /**
   * Second longitudinal length, in millimetres and defined exactly like
   * `width`. The roll is faded by both, so the shorter of the two bounds the
   * region of full relief and the product of the two envelopes shapes the
   * transition. It does not validate the section.
   */
  reach: number;

  /** Optional medial-to-lateral weights for the seven lower-lid witnesses. */
  weights?: readonly number[];
}
