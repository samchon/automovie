import type { IAutoMovieHumanSkinLandmarkSurface } from "./IAutoMovieHumanSkinLandmarkSurface";
import type { IAutoMovieHumanSkinRegion } from "./IAutoMovieHumanSkinRegion";

/**
 * A basis that may name areas of its skin: its identity, its surfaces'
 * positions and its named skin areas. Face and body bases both satisfy it.
 *
 * @evidence contracts/common.md#principled-implementation Face and body bases share one owner of named skin areas through the fields both carry.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The holder reads only what admission needs.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions Positions are the basis's flat XYZ metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The holder defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The holder carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The holder emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The holder builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The holder is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The consumer rule cites each area's definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The holder admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The holder converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegionHolder {
  /** The basis identity, named in refusals. */
  id: string;

  /** The basis surfaces, by index. */
  surfaces: readonly IAutoMovieHumanSkinLandmarkSurface[];

  /** The basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
