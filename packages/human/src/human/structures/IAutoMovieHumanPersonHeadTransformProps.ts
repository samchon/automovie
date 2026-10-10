import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";
import type { IAutoMovieHumanPersonHeadAnchor } from "./IAutoMovieHumanPersonHeadAnchor";

/**
 * What the head transform is built from: the face frame's anchor in the
 * neutral and shaped bodies, and the head bone's shaped rest and posed frames.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransformProps {
  /** The face frame's anchor, neutral and shaped. */
  anchor: IAutoMovieHumanPersonHeadAnchor;

  /** The head bone's shaped rest frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The head bone's posed frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
