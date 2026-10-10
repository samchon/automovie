import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonFaceRest } from "./IAutoMovieHumanPersonFaceRest";

/**
 * What forming a one-skin person's posed skin reads from one evaluation: the
 * face producer's skin, the head carry, the body's rest of the shared and
 * band vertices, its bones and its posed skin.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSkinFrame {
  /** The face producer's evaluated skin of the face view, by skin vertex. */
  faceRest: IAutoMovieHumanPersonFaceRest;

  /** The head carry's rest-frame translation, XYZ metres. */
  shift: readonly number[];

  /** The body's shaped rest of the plan's rest rows, three numbers per row. */
  bodyRest: readonly number[];

  /** The body's bones by bone. */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBuild["bones"][number]>;

  /** The body builder's posed skin positions. */
  bodyPosed: readonly number[];
}
