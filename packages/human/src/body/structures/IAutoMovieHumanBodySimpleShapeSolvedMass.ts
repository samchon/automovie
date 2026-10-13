import type { IAutoMovieHumanBodySimpleShapeTerm } from "./IAutoMovieHumanBodySimpleShapeTerm";

/**
 * The mass direction: the channels a kilogram is spread over, as term rows
 * whose products are the direction's coefficients. The mass is solved as one
 * scalar along the direction, over the envelope of the channel named `range`.
 *
 * @evidence contracts/common.md#principled-implementation Term products define a channel-space direction; a named channel envelope bounds its scalar inversion.
 * @evidence contracts/common.md#clear-and-simple-design The scalar range owner stays explicit alongside the direction's row list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A direction is a legacy basis coordinate, not a physiological distribution of added kilograms.
 * @evidence contracts/common.md#meaningful-documentation The comment states scalar solving, term coefficients and envelope ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The mass inversion direction definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mass inversion direction type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mass inversion direction declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSolvedMass {
  /** The channel whose envelope bounds the mass scalar. */
  range: string;

  /** The direction's rows. */
  direction: IAutoMovieHumanBodySimpleShapeTerm[];
}
