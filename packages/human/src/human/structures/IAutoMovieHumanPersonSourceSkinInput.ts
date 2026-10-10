import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * One evaluation of a final face skin: the face model after the face owner's
 * final contact result, and the performed body build it rides.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkinInput {
  /** The evaluated face model, after its final contact result. */
  face: IAutoMovieModel;

  /** The performed body build. */
  body: IAutoMovieHumanBodyBuild;
}
