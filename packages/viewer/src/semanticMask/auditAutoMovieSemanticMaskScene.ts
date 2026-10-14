import type {
  IAutoMovieSemanticMaskCoverage as AutoMovieSemanticMaskCoverage,
  IAutoMovieScene,
  IAutoMovieSemanticMask,
} from "@automovie/interface";
import type * as THREE from "three";

import { maskRoots } from "./maskRoots.js";
import { nearest } from "./nearest.js";
import { unresolvedOf } from "./unresolvedOf.js";

/**
 * Join a supplied palette to assembled scene roots in both directions without painting or mutating the scene. Unresolved lists drawable entries with no claimed object root; unaddressed counts Mesh objects lacking a nearest semantic owner, including hidden geometry. Ownership-only room/opening/slot entries do not require their own drawable. Empty unresolved establishes root membership, while actual visibility, submission and pixels remain separate observations; a cached build audit needs renewal after relevant graph changes.
 *
 * @evidence contracts/common.md#principled-implementation Builds the same canonical roots and counts scene Mesh objects lacking nearest claimed ownership, reporting drawable entries whose roots never resolve without painting or mutating anything.
 * @evidence contracts/common.md#clear-and-simple-design Pure membership audit shares root/nearest/unresolved laws with the pass, while submission/visibility/pixel coverage remains a renderer/capture responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership-only entries are not falsely counted missing, but existing roots and hidden meshes do not prove pixels; build-time cached coverage becomes stale after relevant graph/design/palette changes.
 * @evidence contracts/common.md#meaningful-documentation Documents bidirectional root/mesh membership, ownership-only exceptions, no mutation and the boundary between assembled scene membership and actual rendering.
 * @evidence contracts/performance.md#efficient-algorithms Index/traversal work is O(E+N+M*D) with O(E+R) root/id references and no material, color buffer or pixel allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Hosts may reuse the returned audit only while its graph/design/palette membership is unchanged; this function maintains no cache and equal model names alone are insufficient invalidation evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Roots/ids are call-local and returned coverage contains scalar counts/id strings only; all scene objects remain borrowed and no native resource or task is acquired.
 */
export const auditAutoMovieSemanticMaskScene: (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}) => AutoMovieSemanticMaskCoverage = (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}): AutoMovieSemanticMaskCoverage => {
  const roots: ReturnType<typeof maskRoots> = maskRoots(props);
  let unaddressed: number = 0;
  props.scene.traverse((object: THREE.Object3D): void => {
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    if (nearest(mesh, roots) === undefined) ++unaddressed;
  });
  return { unresolved: unresolvedOf(props.mask, roots), unaddressed };
};
