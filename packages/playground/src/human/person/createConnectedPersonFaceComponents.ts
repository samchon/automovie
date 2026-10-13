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
 * @evidence contracts/common.md#principled-implementation One canonical anatomical tree is rebound to the paired head-view basis and pruned only for channels edited by another owner, preserving source labels/order and downstream exact-coverage validation.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns metadata pruning while the shared face tree owns classification and the Human component-tree constructor owns basis/coverage admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aliases are removed rather than independently reclassified, an entirely empty tree refuses and the adapter does not invent unsupported head channel membership.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies canonical tree provenance, rebinding/pruning, preserved node metadata and downstream exact-coverage authority.
 * @evidence contracts/performance.md#efficient-algorithms Under the canonical acyclic-tree premise, one postorder walk visits n nodes and c channel entries with expected constant excluded-id Set lookup; it creates copied surviving nodes/channel/child arrays and uses O(h) recursion stack for height h, with surfaces/document-field arrays borrowed unchanged.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The adapter produces caller-specific pruned metadata rather than a numerical cache; one excluded-id Set serves the traversal and no previous result is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no result after return and acquires no worker or GPU frame; returned tree metadata lives with the mounted face controls and original surfaces/document-field arrays remain borrowed source data.
 *
 * @author Samchon
 */
export function createConnectedPersonFaceComponents(
  props: ICreateConnectedPersonFaceComponentsProps,
): IAutoMovieHumanFaceComponentTree {
  const excluded: Set<string> = new Set(props.excluded);
  const prune: (node: IAutoMovieHumanFaceComponentTree.Node) => IAutoMovieHumanFaceComponentTree.Node | null = (
    node: IAutoMovieHumanFaceComponentTree.Node,
  ): IAutoMovieHumanFaceComponentTree.Node | null => {
    const children: IAutoMovieHumanFaceComponentTree.Node[] = node.children
      .map(prune)
      .filter(
        (child: IAutoMovieHumanFaceComponentTree.Node | null): child is IAutoMovieHumanFaceComponentTree.Node =>
          child !== null,
      );
    const channels: string[] = node.channels.filter((id: string): boolean => !excluded.has(id));
    if (
      channels.length === 0 &&
      node.surfaces.length === 0 &&
      node.documentFields.length === 0 &&
      children.length === 0
    )
      return null;
    return { ...node, channels, children };
  };
  const root: IAutoMovieHumanFaceComponentTree.Node | null = prune(props.tree.root);
  if (root === null)
    throw new Error(
      `The face component tree has no member left for ${props.basis}.`,
    );
  return { basis: props.basis, root };
}
