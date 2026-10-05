import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Inputs of `createConnectedPersonFaceComponents`: the face editor's anatomical
 * component tree, the person generation's head view basis it is bound to, and
 * the face channels the person edits through another owner (the body
 * channels a face channel aliases).
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Carries the one anatomical classification the person's face section reuses.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Names the tree, its new basis and the channels it gives up.
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
