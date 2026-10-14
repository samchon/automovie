/**
 * Craniofacial proportions on named anatomical supports of the fixed
 * landmark basis. They alter the common host before any attached part is built,
 * not a finished eyeball or an unrelated arbitrary displacement field.
 *
 *
 * @evidence contracts/common.md#principled-implementation Named support displacements and nasion-centred width/length scales alter one common landmark host before attached anatomy fits it.
 * @evidence contracts/common.md#clear-and-simple-design Optional scalar controls keep jaw, chin, forehead, orbit and temple responsibilities distinct from finished eye geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The [-8,8] displacement and [0.7,1.3] scale envelopes are authored admission bounds, not personal clinical measurements or arbitrary fitted displacement fields.
 * @evidence contracts/common.md#meaningful-documentation Each member specifies anatomical support, unit/range/default and the brow support's aperture-preserving omission meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitFacialFrameShape is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitFacialFrameShape declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitFacialFrameShape starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
 * @author Samchon
 */
export interface IPortraitFacialFrameShape {
  /** Transverse facial scale about the nasion, in [0.7,1.3]; default 1. */
  widthScale?: number;

  /** Vertical facial scale about the nasion, in [0.7,1.3]; default 1. */
  lengthScale?: number;

  /** Signed lateral mandibular-angle displacement in [-8,8] mm; positive widens. */
  jawWidth?: number;

  /** Gnathion inferior displacement in [-8,8] mm; positive lengthens the chin. */
  chinHeight?: number;

  /** Pogonion anterior displacement in [-8,8] mm; positive advances the chin. */
  chinProjection?: number;

  /** Frontal midline anterior displacement in [-8,8] mm; positive advances the forehead. */
  foreheadProjection?: number;

  /**
   * Superior-orbit foundation depth in [-8,8] mm; positive advances and negative
   * recesses both brow supports before fitting the eyes. Zero preserves the
   * original foundation. The optical aperture stays outside this support.
   */
  browProjection?: number;

  /** Signed lateral temporal displacement in [-8,8] mm; positive widens both temples. */
  templeWidth?: number;
}
