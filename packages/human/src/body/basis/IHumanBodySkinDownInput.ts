import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyToeSplit } from "../structures/surface/IAutoMovieHumanBodyToeSplit";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * What `humanBodySkinDownDirection` reads: the shaped and skinned positions and the same skin, joints, transforms and toe split the skinning used.
 *
 * @evidence contracts/common.md#principled-implementation Matching shaped/skinned positions, weights, parent-first joints and transforms preserve the same skinning evaluation used to derive down directions.
 * @evidence contracts/common.md#clear-and-simple-design One input bundles the existing skinning operands and optional toe split rather than independently reconstructing motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Down directions cannot use unmatched rest/posed arrays or invent a toe split absent from the performed surface.
 * @evidence contracts/common.md#meaningful-documentation Members define shaped versus skinned arrays, bone order, frame map and optional toe-ray correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Skin-down typing performs no transported direction or toe skinning computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Operand correspondence describes shared skinning inputs without caching derived directions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed skin arrays and transforms acquire no down-direction output buffer or runtime handle here.
 * @author Samchon
 */
export interface IHumanBodySkinDownInput {
  /** Shaped rest positions. */
  positions: number[];

  /** Those positions skinned by the document's pose. */
  skinned: number[];

  /** The surface's skin weights. */
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"];

  /** Every bone parent before child. */
  joints: Parameters<typeof skinHumanBodySurface>[2];

  /** Rest and posed transforms by bone. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** The surface's toe ray split, if it has one. */
  toeSplit?: IAutoMovieHumanBodyToeSplit;
}
