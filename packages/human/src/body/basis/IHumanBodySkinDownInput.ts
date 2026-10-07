import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyToeSplit } from "../structures/surface/IAutoMovieHumanBodyToeSplit";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * What `humanBodySkinDownDirection` reads: the shaped and skinned positions
 * and the same skin, joints, transforms and toe split the skinning used.
 *
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
