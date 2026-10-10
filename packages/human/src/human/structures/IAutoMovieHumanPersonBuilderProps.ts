import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";

/**
 * What a builder of whole people is compiled from: a face basis, a body
 * basis, and the face producer's optional occlusion bake.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBuilderProps {
  /** The face basis. */
  face: IAutoMovieHumanFaceBasis;

  /** The body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
