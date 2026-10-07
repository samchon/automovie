/**
 * Immutable native triangle sheet and ordered free guide in head-frame metres.
 * The guide is an internal anatomical registration result, not a personal
 * sculpting input. Width does not participate in its geometric representation.
 *
 * @evidence contracts/common.md#principled-implementation Immutable native positions and indices keep the guide in the skin host state, without a width-dependent sampling control.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the geometric result or input owned by this declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity and explicit numerical units retain the source meaning without an anatomical default or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members document ownership, units and numerical distinctions needed by the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres remain public; dimensionless native feature parameters and explicit local scale are internal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry on an existing skin part and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing caller geometry or its reading and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no render primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Native continuity is checked by the compiled course owner, not certified by this transport type.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers own assembled skin observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence without a measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the relief and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal sculpting interface or clinical conversion.
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourseInput {
  /** Flat triples owned by the immutable skin host. */
  positions: readonly number[];

  /** Actual resident triangle winding, flat triples. */
  indices: readonly number[];

  /** Ordered finite three-dimensional guide points, in the same frame. */
  guide: readonly (readonly number[])[];
}
