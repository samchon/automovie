import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Inputs of `placeHumanPersonSkinPart`: one skin render part of a partition,
 * the evaluated skin it takes positions and normals from, and the source
 * domains its correspondence moves between.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinPartProps {
  /** The partition builder's render part mesh. */
  mesh: IAutoMovieMesh;

  /** The skin vertex each render vertex reads, in render order. */
  sources: readonly number[];

  /** The partition's evaluated posed skin positions. */
  positions: readonly number[];

  /** The one normal field over both halves: head vertices first, then body. */
  normals: readonly number[];

  /** Where this partition's vertices start in `normals`: zero for the head, the head count for the body. */
  offset: number;

  /** The partition's source sample per skin vertex. */
  samples: readonly number[];

  /** The source domain the partition builder registered the part in. */
  origin: string;

  /** The person's source domain the part is moved to. */
  domain: string;
}
