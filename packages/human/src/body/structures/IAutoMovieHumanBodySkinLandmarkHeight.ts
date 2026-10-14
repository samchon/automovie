/**
 * The vertical height of a named skin point above a ground landmark, as an
 * anthropometer reads a drawn landmark's height from the standing surface.
 *
 * `to` is a fixed anatomical landmark registered on the basis skin
 * (`skinLandmarks`), so the reading follows it on every shape; `from` is the
 * joint landmark the horizontal ground plane passes through.
 *
 * @evidence contracts/common.md#principled-implementation A skin landmark's vertical coordinate relative to a joint landmark's horizontal plane gives its height.
 * @evidence contracts/common.md#clear-and-simple-design The discriminator identifies the mixed joint-plane and skin-point instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The requested point follows its basis registration; no neutral-shape height substitutes for it.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the ground joint landmark from the measured skin landmark.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The registered skin height rules definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The registered skin height rules type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The registered skin height rules declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkHeight {
  /** A skin landmark's height above the ground plane. */
  kind: "skin-height";

  /** Joint landmark id the horizontal ground plane passes through. */
  from: string;

  /** Skin landmark name whose height is read. */
  to: string;
}
