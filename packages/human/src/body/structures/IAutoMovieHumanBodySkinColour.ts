import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The body's cheek albedo reference in linear RGB. Appearance derives its
 * other sites through the existing site table; a linked person derives this
 * reference from its face instead of authoring an independent body colour.
 *
 * @evidence contracts/common.md#principled-implementation A linear cheek albedo is the reference from which the site table derives body colour; linked persons obtain it from their face.
 * @evidence contracts/common.md#clear-and-simple-design One shared facial reference avoids a separately authored body colour in linked composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The site transformation depends on declared material inputs rather than a person's sampled photograph.
 * @evidence contracts/common.md#meaningful-documentation The comment states linear RGB, the positive unit interval and linked-person ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The cheek albedo reference definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The cheek albedo reference type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The cheek albedo reference declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinColour {
  /** Cheek albedo, linear RGB with each component in (0,1]. */
  cheek: IAutoMovieHumanBodyLinearRgb;
}
