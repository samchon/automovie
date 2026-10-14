/**
 * One joint's extension-side skin.
 *
 * @evidence contracts/common.md#principled-implementation A side-neutral joint region carries linear RGB ratios at extended and folded states with a degree-valued interpolation endpoint.
 * @evidence contracts/common.md#clear-and-simple-design One prominence record contains its geometric support and its two appearance states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The local albedo ratios describe a supported procedural layer rather than hardcoded source vertex colours.
 * @evidence contracts/common.md#meaningful-documentation Members document metre-valued support, linear ratios and folded flexion degrees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The joint prominence colour schema is a data type with no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The joint prominence colour schema declaration performs no request coordination or result sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The joint prominence colour schema owns no runtime resource acquisition or release.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinSiteProminence {
  /** The distal bone of the joint without its side, on both sides: `LowerArm` is the elbow. */
  bone: string;

  /** Width along the bone, metres. */
  sigmaMetres: number;

  /** Distance from the bone's axis within which skin is the joint's, metres. */
  reachMetres: number;

  /** Linear RGB albedo ratio to the surrounding site with the joint straight. */
  extended: [number, number, number];

  /** The ratio with the joint folded. */
  folded: [number, number, number];

  /** Flexion at which the skin reads as folded, degrees. */
  foldedAtDegrees: number;
}
