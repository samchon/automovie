/**
 * One eye's globe: the surface carrying it and its attachment owner.
 *
 * @evidence contracts/common.md#principled-implementation The named source surface selects the legacy closed globe exterior while its existing eye attachment owner supplies the live joint motion used by neighbouring lash frames.
 * @evidence contracts/common.md#clear-and-simple-design Surface geometry and rigid owner identity are separate names; independently generated optics can replace exterior geometry without adding another gaze transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source surface/collider/positions yields no legacy exterior and absent eye motion refuses lash construction; a named globe owner does not certify measured ocular shape or a clinical pivot.
 * @evidence contracts/common.md#meaningful-documentation Resident surface identity versus articulation eye ID describes the exact two lookup domains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no hull closure or motion lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared exterior selection belongs to readHumanFaceOpticalExterior, not a cache in this pair.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two names create no globe mesh or rigid-motion resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularGlobe {
  /** ID of the basis surface that carries the globe. */
  surface: string;

  /** Attachment owner of the globe on that surface, the articulation eye ID. */
  owner: string;
}
