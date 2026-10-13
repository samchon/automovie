import { autoMovieSemanticMaskNodeIndex } from "@automovie/engine";
import type { IAutoMovieScene, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Objects whose whole subtree belongs to one entry.
 *
 * Staged nodes are matched positionally because {@link buildScene} adds one
 * group per designed node, in order; everything else is matched by its own
 * name. Both readings are kept because a host is free to leave those groups
 * anonymous, and the mask must resolve the scene the viewer builds rather than
 * the scene a test found convenient to assemble.
 */
export const maskRoots = (props: {
  /** Built scene whose initial children follow the design node order. */
  scene: THREE.Scene;

  /** Staged node identities used to resolve anonymous top-level groups. */
  design: IAutoMovieScene;

  /** Palette from the same production, also indexed by named descendants. */
  mask: IAutoMovieSemanticMask;
}): Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> => {
  const { scene, design, mask } = props;
  if (scene.children.length < design.nodes.length)
    throw new Error(
      `semantic mask cannot resolve staged nodes: the scene holds ${scene.children.length} top-level children for ${design.nodes.length} designed nodes`,
    );
  const byNode = autoMovieSemanticMaskNodeIndex(mask);
  const roots = new Map<THREE.Object3D, IAutoMovieSemanticMaskEntry>();
  design.nodes.forEach((node, index) => {
    const entry = byNode.get(node.id);
    if (entry !== undefined) roots.set(scene.children[index]!, entry);
  });
  scene.traverse((object) => {
    const entry = byNode.get(object.name);
    if (entry !== undefined) roots.set(object, entry);
  });
  return roots;
};
