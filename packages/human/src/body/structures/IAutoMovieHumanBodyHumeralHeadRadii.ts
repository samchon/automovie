/**
 * Explicit spherical humeral-head radii carried by a body document, in
 * millimetres. Omitted sides retain the existing population-prior owner;
 * admission owns positive finite dimensions and registration qualification.
 *
 * @evidence contracts/common.md#principled-implementation Retains the two existing independently optional radius fields without inferring a shaft or changing their numerical meaning.
 * @evidence contracts/common.md#clear-and-simple-design One named record carries the document's paired articular radius overrides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independently optional left/right absolute radii remain authored dimensions; omission is distinct from zero and preserves the existing prior selection.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, omission and the admission/prior owners.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It carries dimensions and defines no anatomical part.
 * @evidence contracts/modeling.md#parameter-channels Left and right radius overrides remain independent absolute dimensions; omission retains the existing prior.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The two spherical articular radii are millimetres; createHumanBodyHumeralHeads owns the explicit division by 1000 into metre geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The articular candidate and body builders own placement.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming candidate/body assembly owns observation.
 * @evidence contracts/anatomy.md#anatomical-source Explicit sides are caller-authored spherical articular radius dimensions; omitted sides use the existing createHumanBodyHumeralHeads population-prior owner. Neither the override nor the type establishes imaged personal head geometry or a shaft.
 * @evidenceExclude contracts/anatomy.md#permitted-range Document and candidate admission own finite positive radii and qualification.
 * @evidence contracts/anatomy.md#parametric-authority The public input is a named left/right humeral-head radius in millimetres, not a surface control. The existing candidate owner converts to metres; there is no recovery of full humeral anatomy from this scalar.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyHumeralHeadRadii {
  /** Optional left spherical head radius, millimetres. */
  leftRadiusMillimetres?: number;

  /** Optional right spherical head radius, millimetres. */
  rightRadiusMillimetres?: number;
}
