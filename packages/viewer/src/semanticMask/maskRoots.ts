import { autoMovieSemanticMaskNodeIndex } from "@automovie/engine";
import type {
  IAutoMovieScene,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Objects whose whole subtree belongs to one entry.
 *
 * Staged nodes are matched positionally because {@link buildScene} adds one group per designed node, in order; everything else is matched by its own name. Both readings are kept because a host is free to leave those groups anonymous, and the mask must resolve the scene the viewer builds rather than the scene a test found convenient to assemble.
 *
 * @evidence contracts/common.md#principled-implementation Requires enough top-level children, indexes canonical mask node names and binds designed nodes positionally before named traversal overrides with actual matching objects.
 * @evidence contracts/common.md#clear-and-simple-design One root-index owner serves both painter and nonmutating audit; nearest ancestor lookup and unresolved classification remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only child-count is checked here: correct initial declaration order, admitted nonambiguous mask index and object names remain producer premises. Names/root presence cannot certify actual drawable pixels.
 * @evidence contracts/common.md#meaningful-documentation Documents anonymous staged groups, named descendants, positional order and too-short scene refusal without claiming full build validity.
 * @evidence contracts/performance.md#efficient-algorithms Engine indexing plus designed-node loop and full scene traversal cost O(E+S+N), with one object-keyed Map and no repeated palette scan per object.
 * @evidence contracts/performance.md#reuse-equivalent-work One call-local root map is reused by its owning paint/audit operation; changed graph/order/palette needs a fresh map rather than a name-only cached result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned Map borrows scene object/document references for that operation scope and acquires no geometry/material/native handle; caller releases the map when the audit/pass ends.
 */
export const maskRoots: (props: {
  /** Built scene whose initial children follow the design node order. */
  scene: THREE.Scene;

  /** Staged node identities used to resolve anonymous top-level groups. */
  design: IAutoMovieScene;

  /** Palette from the same production, also indexed by named descendants. */
  mask: IAutoMovieSemanticMask;
}) => Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> = (props: {
  /** Built scene whose initial children follow the design node order. */
  scene: THREE.Scene;

  /** Staged node identities used to resolve anonymous top-level groups. */
  design: IAutoMovieScene;

  /** Palette from the same production, also indexed by named descendants. */
  mask: IAutoMovieSemanticMask;
}): Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> => {
  const { scene, design, mask }: Parameters<typeof maskRoots>[0] = props;
  if (scene.children.length < design.nodes.length)
    throw new Error(
      `semantic mask cannot resolve staged nodes: the scene holds ${scene.children.length} top-level children for ${design.nodes.length} designed nodes`,
    );
  const byNode: ReturnType<typeof autoMovieSemanticMaskNodeIndex> =
    autoMovieSemanticMaskNodeIndex(mask);
  const roots: Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> = new Map<
    THREE.Object3D,
    IAutoMovieSemanticMaskEntry
  >();
  design.nodes.forEach(
    (node: IAutoMovieScene["nodes"][number], index: number): void => {
      const entry: IAutoMovieSemanticMaskEntry | undefined = byNode.get(
        node.id,
      );
      if (entry !== undefined) roots.set(scene.children[index]!, entry);
    },
  );
  scene.traverse((object: THREE.Object3D): void => {
    const entry: IAutoMovieSemanticMaskEntry | undefined = byNode.get(
      object.name,
    );
    if (entry !== undefined) roots.set(object, entry);
  });
  return roots;
};
