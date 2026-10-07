import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

import type { ICreateConnectedPersonFaceComponentsProps } from "./ICreateConnectedPersonFaceComponentsProps";

/**
 * The person editor's face component tree: the face editor's own anatomical
 * classification (`connectedFaceComponents`) bound to the person generation's
 * head view.
 *
 * The person's head view carries the face basis's channels by name, so the
 * same groups (frame, eyes, nose, mouth, ears, appearance) and their channel
 * lists apply. Two things differ. The tree names the head view's basis
 * identity, which `createHumanFaceComponentTree` checks. A face channel the
 * person edits through another owner (a body channel it aliases, such as the
 * neck and the global macros) leaves the tree, and a group left with no member
 * leaves with it; the panel lists those channels disabled with their owner.
 * Every other node, label, description and order is the face tree's own, so a
 * part owner extends the classification once, in the face tree, and both
 * editors show it. Whether the result covers the head view's channels exactly
 * is `createHumanFaceComponentTree`'s check, which refuses a mismatch by name.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Lets the person's face section browse the same named anatomical parts as the face editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Groups the person's face controls by part on the person editor's screen.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Rebinds the one authored component tree to the head view's basis without copying the classification.
 * @author Samchon
 */
export function createConnectedPersonFaceComponents(
  props: ICreateConnectedPersonFaceComponentsProps,
): IAutoMovieHumanFaceComponentTree {
  const excluded = new Set(props.excluded);
  const prune = (
    node: IAutoMovieHumanFaceComponentTree.Node,
  ): IAutoMovieHumanFaceComponentTree.Node | null => {
    const children = node.children
      .map(prune)
      .filter(
        (child): child is IAutoMovieHumanFaceComponentTree.Node =>
          child !== null,
      );
    const channels = node.channels.filter((id) => !excluded.has(id));
    if (
      channels.length === 0 &&
      node.surfaces.length === 0 &&
      node.documentFields.length === 0 &&
      children.length === 0
    )
      return null;
    return { ...node, channels, children };
  };
  const root = prune(props.tree.root);
  if (root === null)
    throw new Error(
      `The face component tree has no member left for ${props.basis}.`,
    );
  return { basis: props.basis, root };
}
