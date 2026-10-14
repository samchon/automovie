/**
 * Optional one-body pretarsal roll. These values shape visible surface
 * fullness in the lower-lid construction; they are not a claim about muscle
 * thickness or a detached tissue mesh.
 *
 *
 * @evidence contracts/common.md#principled-implementation Independent transverse roll dimensions and two longitudinal smoothstep extents describe one authored pretarsal fullness envelope.
 * @evidence contracts/common.md#clear-and-simple-design portraitEyeLidRows owns the continuous roll section while the component owns admission/contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The roll is visible surface authoring rather than muscle-thickness measurement or a detached tissue mesh.
 * @evidence contracts/common.md#meaningful-documentation Fields give millimetres, optional seven witnesses and width/reach product meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitAegyoSalShape is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitAegyoSalShape declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitAegyoSalShape acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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
