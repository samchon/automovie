/**
 * A part's exact skin attachment, in the host's millimetre coordinate frame.
 * The host spreads its displacement through neighbouring skin within reach.
 *
 * @evidence contracts/common.md#principled-implementation A constraint is a resident vertex, its requested position and a reach along the original skin, which is exactly what blendPortraitSkin needs to pin a vertex and spread the displacement.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSkinConstraint carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, that the vertex identity survives assembly and subdivision and what reach means.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the host frame, stated on the members.
 * @evidence contracts/modeling.md#shared-boundaries The vertex is a resident host identity that several components may share, and contradictory targets for it refuse.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitSkinConstraint carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitSkinConstraint admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitSkinConstraint defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitSkinConstraint {
  /** Existing host vertex identity, retained through assembly and subdivision. */
  vertex: number;

  /** Requested XYZ position of that shared attachment vertex, in millimetres. */
  target: number[];

  /** Maximum distance along the original skin over which surrounding skin adapts. */
  reach: number;
}
