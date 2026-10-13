/**
 * The straight distance between two named skin points, as a sliding caliper's
 * blades read it between two drawn landmarks.
 *
 * Both points are fixed anatomical landmarks registered on the basis skin
 * (`skinLandmarks`), so the reading follows them on every shape.
 *
 * @evidence contracts/common.md#principled-implementation Two registered skin landmark names define a straight distance on each shaped surface.
 * @evidence contracts/common.md#clear-and-simple-design The skin-distance discriminator separates skin landmarks from joint landmark rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule follows the registered points rather than a copied expected distance.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes skin registration and sliding-caliper semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The registered skin distance rules definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The registered skin distance rules type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The registered skin distance rules declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkDistance {
  /** A straight distance between two skin landmarks. */
  kind: "skin-distance";

  /** Skin landmark name at one end. */
  from: string;

  /** Skin landmark name at the other end. */
  to: string;
}
