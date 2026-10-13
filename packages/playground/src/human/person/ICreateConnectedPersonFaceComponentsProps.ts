import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Inputs of `createConnectedPersonFaceComponents`: the face editor's anatomical
 * component tree, the person generation's head view basis it is bound to, and
 * the face channels the person edits through another owner (the body
 * channels a face channel aliases).
 *
 * @author Samchon
 */
export interface ICreateConnectedPersonFaceComponentsProps {
  /** The face editor's anatomical component tree (`connectedFaceComponents`). */
  tree: IAutoMovieHumanFaceComponentTree;

  /** The head view basis identity the person's face section edits. */
  basis: string;

  /** Face channels the person edits through another owner; they leave the tree. */
  excluded: readonly string[];
}
